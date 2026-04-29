from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
        ('contacts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pipeline',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('is_default', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.user')),
            ],
            options={'ordering': ['-is_default', 'name']},
        ),
        migrations.CreateModel(
            name='Stage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('order', models.PositiveIntegerField(default=0)),
                ('color', models.CharField(default='#3B82F6', max_length=7)),
                ('probability', models.PositiveIntegerField(default=0)),
                ('pipeline', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stages', to='pipeline.pipeline')),
            ],
            options={'ordering': ['pipeline', 'order'], 'unique_together': {('pipeline', 'name')}},
        ),
        migrations.CreateModel(
            name='Deal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=300)),
                ('description', models.TextField(blank=True)),
                ('value', models.DecimalField(decimal_places=2, default=0, max_digits=14, validators=[django.core.validators.MinValueValidator(0)])),
                ('currency', models.CharField(default='INR', max_length=3)),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium', max_length=10)),
                ('status', models.CharField(choices=[('open', 'Open'), ('won', 'Won'), ('lost', 'Lost')], default='open', max_length=10)),
                ('expected_close_date', models.DateField(blank=True, null=True)),
                ('closed_at', models.DateTimeField(blank=True, null=True)),
                ('lost_reason', models.CharField(blank=True, max_length=300)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('pipeline', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='deals', to='pipeline.pipeline')),
                ('stage', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deals', to='pipeline.stage')),
                ('contact', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deals', to='contacts.contact')),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deals', to='accounts.user')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_deals', to='accounts.user')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='deal',
            index=models.Index(fields=['status', 'pipeline'], name='pipeline_de_status_idx'),
        ),
        migrations.AddIndex(
            model_name='deal',
            index=models.Index(fields=['assigned_to', 'status'], name='pipeline_de_assigned_idx'),
        ),
        migrations.CreateModel(
            name='DealNote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('deal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='pipeline.deal')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.user')),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
