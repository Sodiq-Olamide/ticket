web: python backend/manage.py migrate && python backend/manage.py init_admin && gunicorn --chdir backend core.wsgi --bind 0.0.0.0:$PORT
