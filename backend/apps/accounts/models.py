import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from apps.companies.models import Company
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email doit être renseignée.")
        email = self.normalize_email(email)
        extra_fields.setdefault("username", email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "superadmin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User (AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='utilisateurs',
        null=True,
        blank=True
    )
    role = models.CharField(
        max_length=20,
        choices=[
            ("superadmin", "Super Admin"),
            ("pdg", "PDG / Direction Générale"),
            ("responsable_rh", "Responsable RH"),
            ("admin_rh", "Responsable RH"),
            ("manager", "Manager"),
            ("employe", "Employe"),
        ],
        default="employe",
    )
    signature = models.TextField(blank=True, default="", help_text="Signature en Base64 ou SVG")
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"


