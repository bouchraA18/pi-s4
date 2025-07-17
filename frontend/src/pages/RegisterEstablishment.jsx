import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function RegisterEstablishment() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm: '',
    nom: '',
    telephone: '',
    niveau: '',
    type:'public',
    localisation_id: '',
    autorisation: null,
  });
  const [error, setError] = useState('');
  const [localisations, setLocalisations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch localisation options (assumes you have /api/localisations/)
    axios.get('http://localhost:8000/api/localisations/')
      .then(res => setLocalisations(res.data))
      .catch(() => setLocalisations([]));
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      return setError("Les mots de passe ne correspondent pas.");
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => data.append(key, val));

    try {
      const res = await axios.post('http://localhost:8000/api/register/establishment/', data);
      if (res.status === 201) {
        navigate('/login/establishment');
      }
    } catch (err) {
      setError("Erreur lors de l'inscription. Veuillez vérifier vos informations.");
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <h2 style={styles.title}>Inscription Établissement</h2>
        {error && <div style={styles.errorBox}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.form} encType="multipart/form-data">
          <input name="nom" placeholder="Nom de l’établissement" required onChange={handleChange} style={styles.input} />
          <input name="email" type="email" placeholder="Email" required onChange={handleChange} style={styles.input} />
          <input name="telephone" type="tel" placeholder="Téléphone" required onChange={handleChange} style={styles.input} />
          <input name="password" type="password" placeholder="Mot de passe" required onChange={handleChange} style={styles.input} />
          <input name="confirm" type="password" placeholder="Confirmer le mot de passe" required onChange={handleChange} style={styles.input} />

          <select name="niveau" required onChange={handleChange} style={styles.input}>
            <option value="">Niveau</option>
            <option value="primaire">Primaire</option>
            <option value="secondaire">Secondaire</option>
            <option value="supérieur">Supérieur</option>
          </select>

          <select name="type" required onChange={handleChange} style={styles.input}>
            <option value="publique">Publique</option>
            <option value="privée">Privée</option>
          </select>


          <select name="localisation_id" required onChange={handleChange} style={styles.input}>
            <option value="">Localisation</option>
            {localisations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.ville}, {loc.quartier}
              </option>
            ))}
          </select>

          <label>Autorisation (PDF ou image)</label>
          <input name="autorisation" type="file" accept="application/pdf,image/*" required onChange={handleChange} />

          <button type="submit" style={styles.button}>S’inscrire</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f5f7fa',
  },
  card: {
    background: '#fff',
    padding: '2rem 2.5rem',
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    maxWidth: '600px',
    width: '100%',
  },
  title: {
    fontSize: '1.8rem',
    color: '#003580',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.8rem 1rem',
    borderRadius: 8,
    marginBottom: '1rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '0.9rem 1rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#003580',
    color: 'white',
    padding: '1rem',
    fontSize: '1.1rem',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
};

export default RegisterEstablishment;
