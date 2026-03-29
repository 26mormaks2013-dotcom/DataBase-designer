from flask import Flask, render_template, request, jsonify, send_file, session
from flask_cors import CORS
import json
import io
import os
import uuid
from datetime import datetime
import hashlib

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
CORS(app)

# Store database schema in memory
database_schema = {
    "tables": []
}

# Users database
users_db = {}

# Load users from file if exists
USERS_FILE = 'users.json'
if os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        users_db = json.load(f)

def save_users():
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users_db, f, ensure_ascii=False, indent=2)

# Themes
THEMES = [
    {"id": "dark", "name": "Темна", "bg": "#1e1e1e", "text": "#cccccc", "accent": "#0078d4"},
    {"id": "light", "name": "Світла", "bg": "#ffffff", "text": "#333333", "accent": "#0078d4"},
    {"id": "midnight", "name": "Північ", "bg": "#0d1117", "text": "#c9d1d9", "accent": "#58a6ff"},
    {"id": "sunset", "name": "Захід", "bg": "#2d1b2d", "text": "#ffd6e0", "accent": "#ff6b9d"},
    {"id": "forest", "name": "Ліс", "bg": "#1a2e1a", "text": "#c8e6c9", "accent": "#4caf50"},
    {"id": "ocean", "name": "Океан", "bg": "#0a192f", "text": "#8892b0", "accent": "#64ffda"},
    {"id": "sunset-orange", "name": "Сонце", "bg": "#1f1410", "text": "#ffccbc", "accent": "#ff9800"},
    {"id": "purple-night", "name": "Фіолет", "bg": "#1a1025", "text": "#e1bee7", "accent": "#9c27b0"},
    {"id": "mint", "name": "М'ята", "bg": "#0f2027", "text": "#b2dfdb", "accent": "#26a69a"},
    {"id": "coral", "name": "Корал", "bg": "#2c1810", "text": "#ffccbc", "accent": "#ff5722"},
    {"id": "blue-gray", "name": "Блакит", "bg": "#263238", "text": "#b0bec5", "accent": "#03a9f4"},
    {"id": "amber", "name": "Бурштин", "bg": "#1a1400", "text": "#ffe082", "accent": "#ffc107"},
    {"id": "rose", "name": "Троянда", "bg": "#2d1f2d", "text": "#f8bbd9", "accent": "#e91e63"},
    {"id": "teal", "name": "Аквамарин", "bg": "#0d2020", "text": "#b2dfdb", "accent": "#009688"},
    {"id": "indigo", "name": "Індиго", "bg": "#1a1a3e", "text": "#c5cae9", "accent": "#3f51b5"},
    {"id": "lime", "name": "Лайм", "bg": "#1a2e0a", "text": "#dce775", "accent": "#8bc34a"},
    {"id": "cyan", "name": "Ціан", "bg": "#0a2020", "text": "#b2ebf2", "accent": "#00bcd4"},
    {"id": "pink", "name": "Рожевий", "bg": "#2d1a2d", "text": "#f48fb1", "accent": "#e91e63"},
    {"id": "brown", "name": "Коричнев", "bg": "#2c1f1a", "text": "#d7ccc8", "accent": "#795548"},
    {"id": "gray", "name": "Сіра", "bg": "#212121", "text": "#bdbdbd", "accent": "#9e9e9e"},
]

# Fonts
FONTS = [
    {"id": "segoe", "name": "Segoe UI", "family": "'Segoe UI', system-ui, sans-serif"},
    {"id": "arial", "name": "Arial", "family": "Arial, sans-serif"},
    {"id": "roboto", "name": "Roboto", "family": "'Roboto', sans-serif"},
    {"id": "open-sans", "name": "Open Sans", "family": "'Open Sans', sans-serif"},
    {"id": "lato", "name": "Lato", "family": "'Lato', sans-serif"},
    {"id": "montserrat", "name": "Montserrat", "family": "'Montserrat', sans-serif"},
    {"id": "poppins", "name": "Poppins", "family": "'Poppins', sans-serif"},
    {"id": "inter", "name": "Inter", "family": "'Inter', sans-serif"},
    {"id": "raleway", "name": "Raleway", "family": "'Raleway', sans-serif"},
    {"id": "ubuntu", "name": "Ubuntu", "family": "'Ubuntu', sans-serif"},
    {"id": "verdana", "name": "Verdana", "family": "Verdana, sans-serif"},
    {"id": "georgia", "name": "Georgia", "family": "Georgia, serif"},
    {"id": "times", "name": "Times New Roman", "family": "'Times New Roman', serif"},
    {"id": "courier", "name": "Courier New", "family": "'Courier New', monospace"},
    {"id": "consolas", "name": "Consolas", "family": "Consolas, monospace"},
    {"id": "monaco", "name": "Monaco", "family": "Monaco, monospace"},
    {"id": "fira-code", "name": "Fira Code", "family": "'Fira Code', monospace"},
    {"id": "source-code", "name": "Source Code Pro", "family": "'Source Code Pro', monospace"},
    {"id": "jetbrains", "name": "JetBrains Mono", "family": "'JetBrains Mono', monospace"},
    {"id": "inconsolata", "name": "Inconsolata", "family": "'Inconsolata', monospace"},
    {"id": "playfair", "name": "Playfair Display", "family": "'Playfair Display', serif"},
    {"id": "merriweather", "name": "Merriweather", "family": "'Merriweather', serif"},
    {"id": "lora", "name": "Lora", "family": "'Lora', serif"},
    {"id": "pt-serif", "name": "PT Serif", "family": "'PT Serif', serif"},
    {"id": "libre-baskerville", "name": "Libre Baskerville", "family": "'Libre Baskerville', serif"},
    {"id": "nunito", "name": "Nunito", "family": "'Nunito', sans-serif"},
    {"id": "quicksand", "name": "Quicksand", "family": "'Quicksand', sans-serif"},
    {"id": "work-sans", "name": "Work Sans", "family": "'Work Sans', sans-serif"},
    {"id": "barlow", "name": "Barlow", "family": "'Barlow', sans-serif"},
    {"id": "oswald", "name": "Oswald", "family": "'Oswald', sans-serif"},
    {"id": "raleway-dots", "name": "Raleway Dots", "family": "'Raleway Dots', cursive"},
    {"id": "dancing-script", "name": "Dancing Script", "family": "'Dancing Script', cursive"},
    {"id": "pacifico", "name": "Pacifico", "family": "'Pacifico', cursive"},
    {"id": "satisfy", "name": "Satisfy", "family": "'Satisfy', cursive"},
    {"id": "great-vibes", "name": "Great Vibes", "family": "'Great Vibes', cursive"},
    {"id": "caveat", "name": "Caveat", "family": "'Caveat', cursive"},
    {"id": "indie-flower", "name": "Indie Flower", "family": "'Indie Flower', cursive"},
    {"id": "shadows-into", "name": "Shadows Into Light", "family": "'Shadows Into Light', cursive"},
    {"id": "amatic", "name": "Amatic SC", "family": "'Amatic SC', cursive"},
    {"id": "comfortaa", "name": "Comfortaa", "family": "'Comfortaa', cursive"},
    {"id": "exo-2", "name": "Exo 2", "family": "'Exo 2', sans-serif"},
    {"id": "kanit", "name": "Kanit", "family": "'Kanit', sans-serif"},
    {"id": "rubik", "name": "Rubik", "family": "'Rubik', sans-serif"},
    {"id": "titillium", "name": "Titillium Web", "family": "'Titillium Web', sans-serif"},
    {"id": "cabin", "name": "Cabin", "family": "'Cabin', sans-serif"},
    {"id": "karla", "name": "Karla", "family": "'Karla', sans-serif"},
    {"id": "mukta", "name": "Mukta", "family": "'Mukta', sans-serif"},
    {"id": "hind", "name": "Hind", "family": "'Hind', sans-serif"},
    {"id": "overpass", "name": "Overpass", "family": "'Overpass', sans-serif"},
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tables', methods=['GET'])
def get_tables():
    return jsonify(database_schema)

@app.route('/api/sync', methods=['POST'])
def sync_tables():
    data = request.json
    if 'tables' in data:
        database_schema['tables'] = data['tables']
    return jsonify({"success": True})

@app.route('/api/tables', methods=['POST'])
def add_table():
    data = request.json
    table = {
        "id": data.get("id", len(database_schema["tables"]) + 1),
        "name": data.get("name", "new_table"),
        "x": data.get("x", 100),
        "y": data.get("y", 100),
        "columns": data.get("columns", [
            {"name": "id", "type": "INTEGER", "primary": True, "autoincrement": True, "nullable": False}
        ]),
        "rows": data.get("rows", [])
    }
    database_schema["tables"].append(table)
    return jsonify(table)

@app.route('/api/tables/<int:table_id>', methods=['PUT'])
def update_table(table_id):
    data = request.json
    for table in database_schema["tables"]:
        if table["id"] == table_id:
            table.update(data)
            return jsonify(table)
    return jsonify({"error": "Table not found"}), 404

@app.route('/api/tables/<int:table_id>', methods=['DELETE'])
def delete_table(table_id):
    database_schema["tables"] = [t for t in database_schema["tables"] if t["id"] != table_id]
    return jsonify({"success": True})

# Auth endpoints
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Ім'я та пароль обов'язкові"}), 400
    
    if username in users_db:
        return jsonify({"error": "Користувач вже існує"}), 400
    
    user_id = str(uuid.uuid4())[:8]
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    users_db[username] = {
        "id": user_id,
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "avatar": None,
        "theme": "dark",
        "font": "segoe",
        "created_at": datetime.now().isoformat()
    }
    
    save_users()
    session['user'] = username
    
    return jsonify({
        "success": True,
        "user": {
            "id": user_id,
            "username": username,
            "email": email,
            "theme": "dark",
            "font": "segoe"
        }
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if username not in users_db:
        return jsonify({"error": "Користувача не знайдено"}), 404
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    if users_db[username]['password_hash'] != password_hash:
        return jsonify({"error": "Невірний пароль"}), 401
    
    session['user'] = username
    user = users_db[username]
    
    return jsonify({
        "success": True,
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user.get('email'),
            "avatar": user.get('avatar'),
            "theme": user.get('theme', 'dark'),
            "font": user.get('font', 'segoe')
        }
    })

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"success": True})

@app.route('/api/profile', methods=['GET'])
def get_profile():
    if 'user' not in session:
        return jsonify({"error": "Не авторизовано"}), 401
    
    username = session['user']
    if username not in users_db:
        return jsonify({"error": "Користувача не знайдено"}), 404
    
    user = users_db[username]
    return jsonify({
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user.get('email'),
            "avatar": user.get('avatar'),
            "theme": user.get('theme', 'dark'),
            "font": user.get('font', 'segoe'),
            "created_at": user.get('created_at')
        }
    })

@app.route('/api/profile', methods=['PUT'])
def update_profile():
    if 'user' not in session:
        return jsonify({"error": "Не авторизовано"}), 401
    
    username = session['user']
    if username not in users_db:
        return jsonify({"error": "Користувача не знайдено"}), 404
    
    data = request.json
    user = users_db[username]
    
    if 'email' in data:
        user['email'] = data['email']
    if 'avatar' in data:
        user['avatar'] = data['avatar']
    if 'theme' in data:
        user['theme'] = data['theme']
    if 'font' in data:
        user['font'] = data['font']
    
    save_users()
    
    return jsonify({
        "success": True,
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user.get('email'),
            "avatar": user.get('avatar'),
            "theme": user.get('theme', 'dark'),
            "font": user.get('font', 'segoe')
        }
    })

@app.route('/api/themes', methods=['GET'])
def get_themes():
    return jsonify({"themes": THEMES})

@app.route('/api/fonts', methods=['GET'])
def get_fonts():
    return jsonify({"fonts": FONTS})

# Export endpoints
@app.route('/api/export/<format>', methods=['GET'])
def export_schema(format):
    if format == 'sql':
        return export_sql()
    elif format == 'json':
        return export_json()
    elif format == 'mysql':
        return export_mysql()
    elif format == 'postgresql':
        return export_postgresql()
    return jsonify({"error": "Unknown format"}), 400

def export_sql():
    sql = "-- SQLite Database Schema\n-- Generated by DB Designer\n\n"
    
    for table in database_schema["tables"]:
        sql += f"CREATE TABLE {table['name']} (\n"
        columns = []
        for col in table["columns"]:
            col_def = f"    {col['name']} {col['type']}"
            if col.get("primary"):
                col_def += " PRIMARY KEY"
            if col.get("autoincrement"):
                col_def += " AUTOINCREMENT"
            if not col.get("nullable", True):
                col_def += " NOT NULL"
            if col.get("default"):
                col_def += f" DEFAULT {col['default']}"
            columns.append(col_def)
        sql += ",\n".join(columns)
        sql += "\n);\n\n"
    
    return send_file(
        io.BytesIO(sql.encode()),
        mimetype='text/plain',
        as_attachment=True,
        download_name='schema.sql'
    )

def export_mysql():
    sql = "-- MySQL Database Schema\n-- Generated by DB Designer\n\n"
    
    for table in database_schema["tables"]:
        sql += f"CREATE TABLE `{table['name']}` (\n"
        columns = []
        primary_keys = []
        for col in table["columns"]:
            col_def = f"    `{col['name']}` {col['type']}"
            if col.get("primary"):
                primary_keys.append(col['name'])
            if not col.get("nullable", True):
                col_def += " NOT NULL"
            if col.get("autoincrement"):
                col_def += " AUTO_INCREMENT"
            if col.get("default"):
                col_def += f" DEFAULT {col['default']}"
            columns.append(col_def)
        if primary_keys:
            columns.append(f"    PRIMARY KEY ({', '.join([f'`{pk}`' for pk in primary_keys])})")
        sql += ",\n".join(columns)
        sql += "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n"
    
    return send_file(
        io.BytesIO(sql.encode()),
        mimetype='text/plain',
        as_attachment=True,
        download_name='schema_mysql.sql'
    )

def export_postgresql():
    sql = "-- PostgreSQL Database Schema\n-- Generated by DB Designer\n\n"
    
    for table in database_schema["tables"]:
        sql += f"CREATE TABLE {table['name']} (\n"
        columns = []
        for col in table["columns"]:
            col_type = col['type']
            if col.get("autoincrement") and col_type == "INTEGER":
                col_type = "SERIAL"
            col_def = f"    {col['name']} {col_type}"
            if col.get("primary") and col_type != "SERIAL":
                col_def += " PRIMARY KEY"
            if not col.get("nullable", True) and col_type != "SERIAL":
                col_def += " NOT NULL"
            if col.get("default") and col_type != "SERIAL":
                col_def += f" DEFAULT {col['default']}"
            columns.append(col_def)
        sql += ",\n".join(columns)
        sql += "\n);\n\n"
    
    return send_file(
        io.BytesIO(sql.encode()),
        mimetype='text/plain',
        as_attachment=True,
        download_name='schema_postgresql.sql'
    )

def export_json():
    return send_file(
        io.BytesIO(json.dumps(database_schema, indent=2, ensure_ascii=False).encode()),
        mimetype='application/json',
        as_attachment=True,
        download_name='schema.json'
    )

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
