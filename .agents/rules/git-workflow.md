# Workflow Git Obligatoire

Pour toute session ou tâche de développement sur ce projet :

1. **Vérifier la branche active** avant toute action.
2. **Ne jamais faire de modifications ni de commits directement sur la branche `main`**.
3. **Cas de figure** :
   - **Nouvel ajout ou nouvelle fonctionnalité / correctif** : Créer et basculer sur une nouvelle branche dédiée (ex: `feature/<nom-descriptif>` ou `fix/<nom-descriptif>`).
   - **Modification concernant une branche déjà existante** : Basculer sur cette branche existante (`git checkout <nom-branche>`) et poursuivre les modifications dessus.
4. **Validation et push** :
   - Commiter les changements de manière claire et atomique sur la branche active.
   - Pousser la branche sur le dépôt distant GitHub (`git push -u origin <nom-branche>`).
