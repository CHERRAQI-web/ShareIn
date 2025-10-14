# Étape 1 : Utiliser une image Node.js officielle
FROM node:16

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier le package.json et package-lock.json
COPY frontend/package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers du projet
COPY frontend/ .

# Construire l'application React
RUN npm run build

# Exposer le port
EXPOSE 3000

# Lancer l'application
CMD ["npm", "start"]
