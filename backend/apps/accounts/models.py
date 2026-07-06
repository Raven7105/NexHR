import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class User (AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(
        max_length=20,
        choices=[
            ("superadmin", "Super Admin"),
            ("admin_rh", "Admin RH"),
            ("manager", "Manager"),
            ("employe", "Employe"),
        ],
        default="employe",
    )

    def __str__(self):
        return f"{self.email} ({self.role})"

