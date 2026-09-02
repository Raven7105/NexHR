from .models import Notification


def create_notification(recipient, title, message, link=""):
    """
    Crée une notification de manière sécurisée pour l'utilisateur destinataire.
    """
    if not recipient:
        return None
    try:
        return Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            link=link,
        )
    except Exception as e:
        print(f"[Notification Error] {e}")
        return None
