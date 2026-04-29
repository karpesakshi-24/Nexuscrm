"""
Quick setup script: creates a superuser and default pipeline with stages.
Run once after first migrate: python manage_setup.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from accounts.models import User
from pipeline.models import Pipeline, Stage

# Create superuser if not exists
if not User.objects.filter(username='admin').exists():
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@nexuscrm.com',
        password='Admin@1234',
        first_name='Super',
        last_name='Admin',
        role='admin',
    )
    print(f'✅ Superuser created: admin / Admin@1234')
else:
    print('ℹ️  Superuser already exists')

# Create default pipeline
if not Pipeline.objects.exists():
    p = Pipeline.objects.create(name='Main Sales Pipeline', is_default=True,
                                 description='Default pipeline for all deals')
    stages = [
        ('Lead In', 0, '#6B7280', 10),
        ('Qualified', 1, '#3B82F6', 25),
        ('Proposal Sent', 2, '#F59E0B', 50),
        ('Negotiation', 3, '#8B5CF6', 75),
        ('Closed Won', 4, '#10B981', 100),
    ]
    for name, order, color, prob in stages:
        Stage.objects.create(pipeline=p, name=name, order=order, color=color, probability=prob)
    print(f'✅ Default pipeline created with {len(stages)} stages')
else:
    print('ℹ️  Pipeline already exists')

print('\n🚀 Setup complete! Run: python manage.py runserver')
