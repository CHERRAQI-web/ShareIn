import bcrypt from 'bcryptjs';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (passwordReceived, hashedPassword) => {
    try {
        // Utilisation de bcrypt.compare pour comparer
        const isMatch = await bcrypt.compare(passwordReceived, hashedPassword);
        return isMatch;
    } catch (err) {
        console.error('Erreur lors de la comparaison des mots de passe:', err);
        throw new Error('Erreur de comparaison');
    }
};