import re
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np
import os

# --- Configuration Initiale ---
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- Définition des champs requis pour le calcul du pourcentage ---
CIN_REQUIRED_FIELDS = ['first_name', 'last_name', 'cin', 'date_of_birth', 'address']
PERMIS_REQUIRED_FIELDS = ['license_number', 'categorie', 'issue_date', 'expiry_date']
CARTE_GRISE_REQUIRED_FIELDS=['numero_immatriculation', 'type', 'type_carburant','marque','numero_chassis']

# --- Fonction d'extraction pour la CIN ---


def preprocess_image_for_ocr(image_bytes, target_area=None):
    """
    Pré-traite une image pour améliorer la reconnaissance OCR.
    target_area peut être utilisé pour se concentrer sur une zone spécifique (comme la catégorie)
    """
    image_pil = Image.open(io.BytesIO(image_bytes))
    image_cv = np.array(image_pil)
    
    # Conversion en niveaux de gris
    gray_image = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    
    # Si une zone cible est spécifiée, on recadre l'image
    if target_area:
        x, y, w, h = target_area
        gray_image = gray_image[y:y+h, x:x+w]
    
    # Amélioration du contraste
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced_image = clahe.apply(gray_image)
    
    # Réduction du bruit
    denoised_image = cv2.medianBlur(enhanced_image, 3)
    
    # Binarisation adaptative (meilleur pour les textes avec des arrière-plans variés)
    bw_image = cv2.adaptiveThreshold(denoised_image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                     cv2.THRESH_BINARY, 11, 2)
    
    # Inversion si nécessaire (texte noir sur fond blanc)
    # Si plus de pixels sont blancs que noirs, on inverse
    if np.count_nonzero(bw_image == 255) > np.count_nonzero(bw_image == 0):
        bw_image = cv2.bitwise_not(bw_image)
    
    return bw_image


def detect_category_area(image_bytes):
    """
    Détecte la zone de la catégorie sur un permis de conduire marocain.
    Retourne les coordonnées (x, y, w, h) de cette zone.
    """
    image_pil = Image.open(io.BytesIO(image_bytes))
    image_cv = np.array(image_pil)
    
    # Conversion en niveaux de gris
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    
    # Détection de contours
    contours, _ = cv2.findContours(gray, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filtrage des contours pour trouver des carrés/cercles de taille appropriée
    min_area = 500  # Ajuster selon la résolution de l'image
    max_area = 5000
    category_areas = []
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if min_area < area < max_area:
            # Approximation du contour
            approx = cv2.approxPolyDP(cnt, 0.01 * cv2.arcLength(cnt, True), True)
            
            # Vérification si c'est un carré ou un cercle
            if len(approx) == 4:  # Carré/rectangle
                x, y, w, h = cv2.boundingRect(cnt)
                # Vérification du ratio (presque carré)
                if 0.7 < w/h < 1.3:
                    category_areas.append((x, y, w, h))
    
    # Retourner la zone la plus probable (la plus à droite par exemple)
    if category_areas:
        # Tri par position x (de gauche à droite)
        category_areas.sort(key=lambda area: area[0])
        return category_areas[-1]  # Le plus à droite
    
    return None

def extract_cin_data(text_recto, text_verso):
    """
    Version PROCEDURALE et ULTIMEMENT robuste.
    Gère les CIN à 5/6 chiffres et les noms avec lignes parasites.
    """
    # --- LIGNE DE VÉRIFICATION ---
    print(">>> DÉMARRAGE DE LA FONCTION D'EXTRACTION PROCEDURALE <<<")

    data = {}
    combined_text = f"{text_recto} {text_verso}"

    # --- 1. Extraction du Nom et Prénom (Logique PROCEDURALE) ---
    
    # On découpe le texte en lignes
    lines = text_recto.split('\n')
    potential_names = []
    
    # On cherche la ligne qui contient "CARTE NATIONALE"
    start_index = -1
    for i, line in enumerate(lines):
        if "CARTE NATIONALE" in line:
            start_index = i
            break
            
    # Si on a trouvé le début, on analyse les lignes suivantes
    if start_index != -1:
        for line in lines[start_index + 1:]:
            # On nettoie la ligne : on ne garde que les lettres majuscules
            clean_line = re.sub(r'[^A-Z]', '', line)
            # Si la ligne nettoyée fait plus de 2 caractères, c'est un potentiel nom/prénom
            if len(clean_line) > 2:
                potential_names.append(clean_line)
            # On s'arrête dès qu'on a trouvé deux noms ou qu'on rencontre "Née le"
            if len(potential_names) == 2 or "Née le" in line:
                break

    if len(potential_names) >= 2:
        data['first_name'] = potential_names[0]
        data['last_name'] = potential_names[1]
        print(f"✅ Nom trouvé (Recto): {data['first_name']} {data['last_name']}")
    else:
        # Fallback sur le verso (MRZ) si le recto échoue
        name_match_verso = re.search(r'([A-Z]{3,})<<([A-Z]{3,})', text_verso)
        if name_match_verso:
            data['last_name'] = name_match_verso.group(1)
            data['first_name'] = name_match_verso.group(2)
            print(f"✅ Nom trouvé (Verso): {data['last_name']} {data['first_name']} (Nom de famille potentiellement tronqué)")

    # --- 2. Extraction du Numéro CIN (Logique CORRIGÉE pour 5 ou 6 chiffres) ---
    
    # On cherche le motif : 2 lettres suivies de 5 ou 6 chiffres.
    cin_match = re.search(r'\b([A-Z]{2}\d{5,6})\b', combined_text)
    if cin_match:
        data['cin'] = cin_match.group(1)
        print(f"✅ CIN trouvé: {data['cin']}")
    else:
        # Fallback plus permissif si le premier échoue
        cin_match_fallback = re.search(r'([A-Z]{2}\d{5,6})', combined_text)
        if cin_match_fallback:
            data['cin'] = cin_match_fallback.group(1)
            print(f"✅ CIN trouvé (Fallback): {data['cin']}")

    # --- 3. Date de Naissance (inchangé, car déjà robuste) ---
    dob_match_recto = re.search(r'Née? le\s+(\d{2}\.\d{2}\.\d{4})', text_recto)
    if dob_match_recto:
        date_str = dob_match_recto.group(1)
        d, m, y = date_str.split('.')
        data['date_of_birth'] = f'{y}-{m}-{d}'
        print(f"✅ Date de naissance trouvée (Recto): {data['date_of_birth']}")
    else:
        mrz_line2_match = re.search(r'(\d{6})\d{5}[MF]\d{7}[\dA-Z]', text_verso)
        if mrz_line2_match:
            date_str = mrz_line2_match.group(1)
            yy, mm, dd = date_str[0:2], date_str[2:4], date_str[4:6]
            current_year_short = int('25')
            century = '20' if yy <= str(current_year_short) else '19'
            data['date_of_birth'] = f'{century}{yy}-{mm}-{dd}'
            print(f"✅ Date de naissance trouvée (Verso/MRZ): {data['date_of_birth']}")

    # --- 4. Adresse (inchangé, car déjà robuste) ---
    data['address'] = None

    # Recherche 1 (Priorité) : Adresse de Résidence sur le verso
    # On cherche les mots-clés 'Adresse' ou 'Résidence' suivis de texte
    address_match_verso = re.search(r'(Adresse|Résidence)\s*[:\n]\s*([^\n]+)', text_verso, re.IGNORECASE | re.DOTALL)
    
    if address_match_verso:
        address = address_match_verso.group(2).strip()
        address = re.sub(r'[<>\d]{5,}', '', address) # Nettoyage MRZ
        address = re.sub(r'\s+', ' ', address).strip() 
        
        if len(address) > 5:
            data['address'] = address
            print(f"✅ Adresse de résidence trouvée (Verso): {data['address']}")

    # Recherche 2 (Fallback) : Lieu de Naissance sur le recto
    if not data.get('address'):
        address_match_recto = re.search(r'à\s+([A-Z\s\d]+)', text_recto)
        if address_match_recto:
            address = re.sub(r'\s+', ' ', address_match_recto.group(1).strip())
            data['address'] = address
            print(f"✅ Adresse/Lieu de naissance trouvé (Recto Fallback): {data['address']}")
        else:
            print("❌ Adresse non trouvée sur recto ou verso.")


    return data


def extract_permis_data(text_recto, text_verso, image_recto_bytes=None):
    """
    Extrait les données d'un permis de conduire.
    Améliorée pour une meilleure extraction de la catégorie.
    """
    data = {}

    def _format_date(date_str):
        try:
            d, m, y = re.split(r'[./]', date_str)
            return f'{y}-{m}-{d}'
        except (ValueError, AttributeError):
            return None

    # 1. Extraction du numéro de permis
    permis_num_match = re.search(r'Permis N°\s*([A-Z0-9/]+)', text_recto, re.IGNORECASE)
    if permis_num_match:
        data['license_number'] = permis_num_match.group(1).strip()
        print(f"✅ Numéro du permis trouvé: {data['license_number']}")

    # 2. Extraction de la catégorie (approche améliorée)
    category_found = False
    
    # Approche 1: Recherche dans le texte OCR standard
    category_after_date_match = re.search(r'Le\s*…\s*\d{2}[./]\d{2}[./]\d{4}.*?([A-Z])', text_recto, re.DOTALL | re.IGNORECASE)
    if category_after_date_match:
        data['categorie'] = category_after_date_match.group(1)
        category_found = True
        print(f"✅ Catégorie trouvée (sous la date d'émission): {data['categorie']}")

    # Approche 2: Recherche de lignes avec des lettres majuscules (améliorée)
    if not category_found:
        # Cherche spécifiquement les lettres seules ou avec des espaces
        categories_recto_match = re.search(r'([A-Z]\s*){2,}', text_recto)
        if categories_recto_match:
            categories_line = categories_recto_match.group(0)
            # Extrait toutes les lettres individuellement
            found_categories = re.findall(r'\b([A-Z])\b', categories_line)
            if found_categories:
                # Prend la première lettre trouvée (généralement la plus à gauche)
                data['categorie'] = found_categories[0]
                category_found = True
                print(f"✅ Catégorie trouvée (ligne de catégories Recto): {data['categorie']}")
    
    # Approche 3: Recherche sur le verso
    if not category_found:
        lines = [line for line in text_verso.strip().split('\n') if line.strip()]
        if lines:
            last_line = lines[-1]
            category_match = re.match(r'^([A-Z])', last_line)
            if category_match:
                data['categorie'] = category_match.group(1)
                category_found = True
                print(f"✅ Catégorie trouvée (Verso): {data['categorie']}")
    
    # Approche 4: Détection et OCR de la zone de catégorie (améliorée)
    if not category_found and image_recto_bytes:
        print("⚠️ Catégorie non trouvée par OCR standard, tentative de détection de zone...")
        category_area = detect_category_area(image_recto_bytes)
        
        if category_area:
            # Traitement spécifique de cette zone
            category_image = preprocess_image_for_ocr(image_recto_bytes, target_area=category_area)
            
            # Configuration Tesseract optimisée pour un seul caractère
            custom_config = '--oem 3 --psm 10 -l fra'
            
            try:
                category_text = pytesseract.image_to_string(category_image, config=custom_config).strip()
                if category_text and len(category_text) == 1 and category_text.isalpha():
                    data['categorie'] = category_text.upper()
                    category_found = True
                    print(f"✅ Catégorie trouvée (détection de zone): {data['categorie']}")
            except Exception as e:
                print(f"Erreur lors de l'OCR de la zone de catégorie: {e}")
    
    # Approche 5: Validation et correction de la catégorie
    if category_found and 'categorie' in data:
        # Liste des catégories valides pour les permis marocains
        valid_categories = ['A', 'A1', 'B', 'C', 'C1', 'D', 'D1', 'E']
        
        # Si la catégorie trouvée n'est pas valide, essayer de la corriger
        if data['categorie'] not in valid_categories:
            print(f"⚠️ Catégorie '{data['categorie']}' suspecte, tentative de correction...")
            
            # Correction basée sur la similarité visuelle
            corrections = {
                'P': 'B',  # P et B peuvent être confondus
                'O': 'D',  # O et D peuvent être confondus
                'I': '1',  # I et 1 peuvent être confondus
                'S': '5',  # S et 5 peuvent être confondus
            }
            
            if data['categorie'] in corrections:
                data['categorie'] = corrections[data['categorie']]
                print(f"✅ Catégorie corrigée en: {data['categorie']}")
            else:
                # Si aucune correction n'est possible, on garde la valeur originale
                print(f"❌ Impossible de corriger la catégorie '{data['categorie']}'")
    
    if not category_found:
        print("❌ Catégorie non trouvée après toutes les tentatives.")

    # 3. Extraction de la date d'émission
    issue_date_match_recto = re.search(r'Le\s*(\d{2}[./]\d{2}[./]\d{4})', text_recto)
    if issue_date_match_recto:
        data['issue_date'] = _format_date(issue_date_match_recto.group(1))
        print(f"✅ Date d'émission trouvée: {data['issue_date']}")


    # 4. Extraction de la date d'expiration
    expiry_date_match = re.search(r'Fin de validité.*?(\d{2}[./]\d{2}[./]\d{4})', text_verso, re.IGNORECASE | re.DOTALL)
    if not expiry_date_match:
        expiry_date_match = re.search(r'validit[ée].*?(\d{2}[/]\d{2}[/]\d{4})', text_verso, re.IGNORECASE | re.DOTALL)
    
    if expiry_date_match:
        data['expiry_date'] = _format_date(expiry_date_match.group(1))
        print(f"✅ Date d'expiration trouvée: {data['expiry_date']}")
    else:
        print("❌ Date d'expiration non trouvée.")
        
    return data

VALID_ARABIC_LETTERS = {
    'أ', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي', 
    'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ص', 'ق', 'ر', 'ش'
}

# Carte de correction pour les erreurs d'OCR courantes
# Associe un caractère mal lu (souvent un chiffre) à la lettre arabe probable.
CORRECTION_MAP = {
    '1': 'أ',  # '1' est souvent mal lu pour 'أ' (Alif) ou 'ب' (Ba). On privilégie 'أ'.
    '2': 'ج',  # '2' peut être confondu avec 'ج' (Jim)
    '3': 'ج',  # '3' peut aussi être confondu avec 'ج' (Jim)
    '5': 'ه',  # '5' peut être confondu avec 'ه' (Ha)
    '7': 'ط',  # '7' peut être confondu avec 'ط' (Ta) ou 'ق' (Qaf)
    '9': 'ص',  # '9' peut être confondu avec 'ص' (Sad)
    # Ajoutez d'autres corrections ici si vous en trouvez.
}

def preprocess_image_for_ocr(image_bytes):
    """
    Améliore une image pour une meilleure reconnaissance OCR.
    """
    image_pil = Image.open(io.BytesIO(image_bytes))
    image_cv = np.array(image_pil)
    
    # Conversion en niveaux de gris
    gray_image = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    
    # Amélioration du contraste (très utile pour les textes estompés)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced_image = clahe.apply(gray_image)
    
    # Binarisation adaptative pour gérer les ombres et les variations
    bw_image = cv2.adaptiveThreshold(enhanced_image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    return bw_image

def correct_middle_char(middle_raw):
    """
    Correction automatique du caractère du milieu s'il est manquant ou illisible.
    """
    if middle_raw == '?':
        print("   -> Caractère manquant, correction supposée.")
        return 'أ'  # Supposons que ce soit un 'أ', mais tu peux ajuster la logique selon le contexte
    return middle_raw

def extract_plate_from_text(text):
    """
    Tente d'extraire et de formater un numéro d'immatriculation
    à partir d'un texte. Retourne le numéro formaté ou None.
    """
    plate_pattern = re.search(r'(\d{1,5})-([^\-]*)-(\d{1,5})', text)
    if plate_pattern:
        part1 = plate_pattern.group(1)
        middle_raw = plate_pattern.group(2).strip()
        part3 = plate_pattern.group(3)

        print(f"   -> Pattern trouvé: Part1='{part1}', Middle='{middle_raw}', Part3='{part3}'")

        # Correction du caractère du milieu
        corrected_middle = correct_middle_char(middle_raw)

        # Vérification du caractère corrigé
        if corrected_middle in VALID_ARABIC_LETTERS:
            print(f"   -> Lettre arabe valide: '{corrected_middle}'")
        elif corrected_middle in CORRECTION_MAP:
            corrected_middle = CORRECTION_MAP[corrected_middle]
            print(f"   -> Correction: '{middle_raw}' -> '{corrected_middle}'")
        else:
            print(f"   -> Caractère non reconnu: '{corrected_middle}'")
        
        final_immat = f"{part1}-{corrected_middle}-{part3}"
        return final_immat
    return None


def extract_carte_grise_data(text_recto, text_verso):
    """
    Version complète et CORRIGÉE qui extrait les 6 champs.
    N'utilise plus de look-behinds pour éviter les erreurs.
    """
    print(">>> DÉMARRAGE DE L'EXTRACTION DE LA CARTE GRISE (VERSION COMPLÈTE CORRIGÉE) <<<")
    data = {}

    # --- 1. Numéro d'immatriculation (sur le Recto) ---
    # CORRIGÉ: On capture ce qui suit le label, sans utiliser de look-behind.
     # --- 1. Numéro d'immatriculation (sur le Recto) ---
    plate_pattern = re.search(r'(\d{1,5})-([^\-]*)-(\d{1,5})', text_recto)

    if plate_pattern:
        part1 = plate_pattern.group(1)
        middle_raw = plate_pattern.group(2).strip()
        part3 = plate_pattern.group(3)

        print(f"🔍 Pattern trouvé: Part1='{part1}', Middle='{middle_raw}', Part3='{part3}'")

        # Correction du caractère du milieu
        corrected_middle = correct_middle_char(middle_raw)
        
        final_immat = f"{part1}-{corrected_middle}-{part3}"
        data['numero_immatriculation'] = final_immat

        print(f"✅ Numéro final: {final_immat}")

    else:
        print("❌ Aucun pattern de numéro d'immatriculation trouvé dans le texte.")


    # --- 2. Première mise en circulation (sur le Recto) ---
    # CORRIGÉ: Même principe ici.
    date_match = re.search(r'MC au Maroc\s*(\d{2}/\d{2}/\d{4})', text_recto)
    if date_match:
        date_str = date_match.group(1)
        d, m, y = date_str.split('/')
        data['premiere_mise_en_circulation'] = f'{y}-{m}-{d}'
        print(f"✅ Première mise en circulation trouvée (Recto): {data['premiere_mise_en_circulation']}")

    # --- 3. Marque (sur le Verso) ---
    # CORRIGÉ: Simple et efficace.
    marque_match = re.search(r'Marque\s*([A-Z]+)', text_verso)
    if marque_match:
        data['marque'] = marque_match.group(1).strip()
        print(f"✅ Marque trouvée (Verso): {data['marque']}")


    # --- 4. Type (sur le Verso) ---
    # CORRIGÉ: Simple et efficace.
    type_match = re.search(r'Type\s*([\w\-]+)', text_verso)
    if type_match:
        data['type'] = type_match.group(1).strip()
        print(f"✅ Type trouvé (Verso): {data['type']}")

    # --- 5. Type carburant (sur le Verso) ---
    # CORRIGÉ: Simple et efficace.
    carburant_match = re.search(r'Type carburant\s*(\w+)', text_verso, re.IGNORECASE)
    if carburant_match:
        data['type_carburant'] = carburant_match.group(1).strip()
        print(f"✅ Type carburant trouvé (Verso): {data['type_carburant']}")

    # --- 6. N° du chassis (sur le Verso) ---
    # CORRIGÉ: On cherche d'abord avec le label, puis on a un plan B au cas où.
    vin_match = re.search(r'N° du chassis\s*([A-Z0-9]{17})', text_verso)
    if vin_match:
        data['numero_chassis'] = vin_match.group(1).strip()
        print(f"✅ N° du chassis (VIN) trouvé (Verso): {data['numero_chassis']}")
    else:
        # PLAN B : Si le label "N° du chassis" est mal lu, on cherche juste le numéro.
        vin_match_fallback = re.search(r'([A-Z0-9]{17})', text_verso)
        if vin_match_fallback:
            data['numero_chassis'] = vin_match_fallback.group(1)
            print(f"✅ N° du chassis (VIN) trouvé (Fallback Verso): {data['numero_chassis']}")

    return data


# --- Fonction pour calculer le pourcentage d'extraction ---
def calculate_extraction_percentage(extracted_data, required_fields):
    """
    Calcule le pourcentage de champs extraits avec succès.
    Retourne un dictionnaire avec des statistiques détaillées.
    """
    total_fields = len(required_fields)
    if total_fields == 0:
        return {
            "percentage": 100.0,
            "found_count": 0,
            "total_fields": 0,
            "missing_fields": []
        }

    found_fields = [field for field in required_fields if field in extracted_data and extracted_data[field]]
    found_count = len(found_fields)
    
    percentage = (found_count / total_fields) * 100
    
    missing_fields = [field for field in required_fields if field not in found_fields]

    return {
        "percentage": round(percentage, 2),
        "found_count": found_count,
        "total_fields": total_fields,
        "missing_fields": missing_fields
    }

# --- Route API Principale ---
@app.route('/extract', methods=['POST'])
def extract_info():
    if 'document_type' not in request.form:
        return jsonify({'error': 'Missing document_type'}), 400
    
    document_type = request.form['document_type']
    final_data = {}

    try:
        if document_type == 'cin':
            if 'file_recto' not in request.files or 'file_verso' not in request.files:
                return jsonify({'error': 'CIN requires both recto and verso images'}), 400

            file_recto = request.files['file_recto']
            file_verso = request.files['file_verso']

            image_recto = Image.open(io.BytesIO(file_recto.read()))
            text_recto = pytesseract.image_to_string(image_recto, lang='fra')
            print("--- Texte extrait du Recto (CIN) ---")
            print(text_recto)

            image_verso = Image.open(io.BytesIO(file_verso.read()))
            text_verso = pytesseract.image_to_string(image_verso, lang='fra')
            print("--- Texte extrait du Verso (CIN) ---")
            print(text_verso)

            final_data = extract_cin_data(text_recto, text_verso)
            # Calcul des statistiques pour la CIN
            extraction_stats = calculate_extraction_percentage(final_data, CIN_REQUIRED_FIELDS)
            final_data['extraction_stats'] = extraction_stats
            print(f"📊 Stats d'extraction CIN: {extraction_stats}")
            return jsonify(final_data), 200

        elif document_type == 'permis':
            if 'file_recto' not in request.files or 'file_verso' not in request.files:
                return jsonify({'error': 'Permis requires both recto and verso images'}), 400

            file_recto = request.files['file_recto']
            file_verso = request.files['file_verso']
            
            # Garder les bytes de l'image pour le traitement spécialisé
            image_recto_bytes = file_recto.read()
            file_recto.seek(0)  # Réinitialiser le curseur pour la lecture suivante

            image_recto = Image.open(io.BytesIO(image_recto_bytes))
            text_recto = pytesseract.image_to_string(image_recto, lang='fra')
            print("--- Texte extrait du Recto (Permis) ---")
            print(text_recto)

            image_verso = Image.open(io.BytesIO(file_verso.read()))
            text_verso = pytesseract.image_to_string(image_verso, lang='fra')
            print("--- Texte extrait du Verso (Permis) ---")
            print(text_verso)

            # Passer les bytes de l'image à la fonction d'extraction
            final_data = extract_permis_data(text_recto, text_verso, image_recto_bytes)
            
            # Calcul des statistiques pour le Permis
            extraction_stats = calculate_extraction_percentage(final_data, PERMIS_REQUIRED_FIELDS)
            final_data['extraction_stats'] = extraction_stats
            print(f"📊 Stats d'extraction Permis: {extraction_stats}")
            return jsonify(final_data), 200
        
        
        elif document_type == 'carte grise':
            if 'file_recto' not in request.files or 'file_verso' not in request.files:
                return jsonify({'error': 'Carte grise requires both recto and verso images'}), 400

            file_recto = request.files['file_recto']
            file_verso = request.files['file_verso']

            # --- LOGIQUE MULTI-APPROCHES POUR LE RECTO ---
            image_recto_bytes = file_recto.read()
            text_recto_final = None
            numero_immatriculation = None

            # Approche 1: L'OCR simple, qui fonctionnait bien avant
            print("--- Tentative 1: OCR Simple (la méthode d'avant) ---")
            try:
                image_pil = Image.open(io.BytesIO(image_recto_bytes))
                text_recto_simple = pytesseract.image_to_string(image_pil, lang='fra')
                print(text_recto_simple)
                numero_immatriculation = extract_plate_from_text(text_recto_simple)
                if numero_immatriculation:
                    text_recto_final = text_recto_simple
                    print(f"✅ Succès avec l'OCR Simple ! Numéro trouvé: {numero_immatriculation}")
            except Exception as e:
                print(f"❌ Erreur lors de l'OCR Simple: {e}")

            # Approche 2: Si la 1 a échoué, on essaie avec un pré-traitement léger (juste niveaux de gris)
            if not numero_immatriculation:
                print("\n--- Tentative 2: OCR avec Niveaux de Gris ---")
                try:
                    image_pil = Image.open(io.BytesIO(image_recto_bytes))
                    gray_image = image_pil.convert('L')
                    text_recto_gray = pytesseract.image_to_string(gray_image, lang='fra')
                    print(text_recto_gray)
                    numero_immatriculation = extract_plate_from_text(text_recto_gray)
                    if numero_immatriculation:
                        text_recto_final = text_recto_gray
                        print(f"✅ Succès avec les niveaux de gris ! Numéro trouvé: {numero_immatriculation}")
                except Exception as e:
                    print(f"❌ Erreur lors de l'OCR en niveaux de gris: {e}")

            # Approche 3: En dernier recours, on peut réessayer le pré-traitement lourd (ma mauvaise idée d'avant)
            # mais on ne l'utilisera que si les deux autres ont échoué.
            if not numero_immatriculation:
                print("\n--- Tentative 3: OCR avec Pré-traitement Lourd ---")
                try:
                    # Assurez-vous que la fonction preprocess_image_for_ocr est toujours dans votre fichier
                    processed_image = preprocess_image_for_ocr(image_recto_bytes) 
                    text_recto_heavy = pytesseract.image_to_string(processed_image, lang='fra')
                    print(text_recto_heavy)
                    numero_immatriculation = extract_plate_from_text(text_recto_heavy)
                    if numero_immatriculation:
                        text_recto_final = text_recto_heavy
                        print(f"✅ Succès avec le pré-traitement lourd ! Numéro trouvé: {numero_immatriculation}")
                except Exception as e:
                    print(f"❌ Erreur lors de l'OCR lourd: {e}")

            # Si tout a échoué, on continue avec un texte vide pour le recto
            if not numero_immatriculation:
                print("\n❌ Échec total de l'extraction du numéro d'immatriculation.")
                text_recto_final = ""

            # --- TRAITEMENT DU VERSO (inchangé) ---
            image_verso = Image.open(io.BytesIO(file_verso.read()))
            text_verso = pytesseract.image_to_string(image_verso, lang='fra')
            print("--- Texte extrait du Verso (carte grise) ---")
            print(text_verso)

            # --- EXTRACTION FINALE DES DONNÉES ---
            final_data = extract_carte_grise_data(text_recto_final, text_verso)
            
            # Si le numéro a été trouvé manuellement, on l'ajoute aux données
            if numero_immatriculation and 'numero_immatriculation' not in final_data:
                final_data['numero_immatriculation'] = numero_immatriculation

            extraction_stats = calculate_extraction_percentage(final_data, CARTE_GRISE_REQUIRED_FIELDS)
            final_data['extraction_stats'] = extraction_stats
            print(f"📊 Stats d'extraction Carte Grise: {extraction_stats}")
            return jsonify(final_data), 200
                
        else:
            return jsonify({'error': f'Unsupported document_type: {document_type}'}), 400

    except Exception as e:
        # Log l'erreur pour le débogage
        app.logger.error(f"Erreur lors du traitement : {str(e)}")
        return jsonify({'error': f'Error during processing: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, port=port)