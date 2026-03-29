# This file contains the WSGI configuration required by PythonAnywhere
# It exposes the Flask app as 'application' for the WSGI server

import sys
import os

# Add your project directory to the sys.path
project_home = os.path.dirname(os.path.abspath(__file__))
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Import your Flask app
from app import app as application

if __name__ == "__main__":
    application.run()