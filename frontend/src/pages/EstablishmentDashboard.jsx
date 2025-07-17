import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapPin,
  Phone,
  Globe,
  Edit,
  ImagePlus,
  LogOut,
  Plus,
  X,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("establishment_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function EstablishmentDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [establishment, setEstablishment] = useState(null);
  const [form, setForm] = useState({
    nom: "",
    type: "publique",
    telephone: "",
    niveau: "",
    localisation_id: "",
    description: "",
    site: "",
    formations: [],
  });
  const [newFormation, setNewFormation] = useState("");
  const [photos, setPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [localisations, setLocalisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const [etabRes, locRes] = await Promise.all([
          api.get("/etablissement/current/"),
          api.get("/localisations/"),
        ]);

        const data = etabRes.data;
        setEstablishment(data);
        setForm({
          nom: data.nom,
          type: data.type || "publique",
          telephone: data.telephone,
          niveau: data.niveau,
          localisation_id: data.localisation?.id || "",
          description: data.description,
          site: data.site || "",
          formations: data.formations?.map(f => f.intitule) || [],
        });
        setPhotos(data.photo_urls || []);
        setLocalisations(locRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(
          err.response?.data?.error || "Failed to load establishment data."
        );
        if (err.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFormChange = ({ target: { name, value } }) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const handlePhotoChange = (e) => setNewPhotos(Array.from(e.target.files));

  const handleAddFormation = () => {
    const trimmed = newFormation.trim();
    if (trimmed && !form.formations.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        formations: [...prev.formations, trimmed],
      }));
      setNewFormation("");
    }
  };

  const handleRemoveFormation = (formation) =>
    setForm((prev) => ({
      ...prev,
      formations: prev.formations.filter((f) => f !== formation),
    }));

  const handleUpdateProfile = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  try {
    const { data } = await api.put(
      `/manage/etablissement/${establishment.id}/`,  // Changed endpoint
      form
    );
    setEstablishment(data);
    setSuccess("Profile updated successfully!");
    setTimeout(() => setSuccess(""), 3000);
  } catch (err) {
    console.error("Update error:", err.response?.data || err.message);
    setError(err.response?.data?.message || "Update failed");
  }
};

  const handleUploadPhotos = async () => {
    if (!newPhotos.length) return;
    try {
      const fd = new FormData();
      newPhotos.forEach((p) => fd.append("photos", p));
      const { data } = await api.post(
        `/etablissement/${establishment.id}/photos/`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setPhotos(data.photos);
      setNewPhotos([]);
      setSuccess("Photos uploaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Photo upload failed");
    }
  };

  const handleDeletePhoto = async (idx) => {
    try {
      await api.delete(`/etablissement/${establishment.id}/photos/${idx}/`);
      setPhotos((prev) => prev.filter((_, i) => i !== idx));
      setSuccess("Photo deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to delete photo");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("establishment_token");
    localStorage.removeItem("refresh_token");
    navigate("/login/establishment");
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800" />
      </div>
    );

  if (!establishment)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error || "Failed to load establishment data"}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-800">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-800"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4 sticky top-8">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${
                    activeTab === "profile"
                      ? "bg-blue-800 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <Edit size={16} /> Profile
                </button>
                <button
                  onClick={() => setActiveTab("photos")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${
                    activeTab === "photos"
                      ? "bg-blue-800 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <ImagePlus size={16} /> Photos
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                {success}
              </div>
            )}

            {activeTab === "profile" ? (
              <div className="bg-white rounded-lg shadow p-6 w-full">
                <h2 className="text-xl font-semibold mb-6 text-blue-800">
                  Edit Profile
                </h2>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        name="nom"
                        value={form.nom}
                        onChange={handleFormChange}
                        required
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Level
                      </label>
                      <select
                        name="niveau"
                        value={form.niveau}
                        onChange={handleFormChange}
                        required
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      >
                        <option value="">Select level</option>
                        <option value="primaire">Primary</option>
                        <option value="secondaire">Secondary</option>
                        <option value="supérieur">Higher Education</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution Type
                      </label>
                      <select
                        name="type"
                        value={form.type}
                        onChange={handleFormChange}
                        required
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      >
                        <option value="publique">Public</option>
                        <option value="privée">Private</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <select
                        name="localisation_id"
                        value={form.localisation_id}
                        onChange={handleFormChange}
                        required
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      >
                        <option value="">Select location</option>
                        {localisations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.ville}, {loc.quartier}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        name="telephone"
                        value={form.telephone}
                        onChange={handleFormChange}
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        name="site"
                        value={form.site}
                        onChange={handleFormChange}
                        placeholder="https://"
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      rows={5}
                      className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Programs
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {form.formations.map((formation, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800 flex items-center gap-1"
                        >
                          {formation}
                          <button
                            type="button"
                            onClick={() => handleRemoveFormation(formation)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFormation}
                        onChange={(e) => setNewFormation(e.target.value)}
                        placeholder="Add program"
                        className="flex-1 p-3 border rounded focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                      <button
                        type="button"
                        onClick={handleAddFormation}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-1"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-800 hover:bg-blue-900 text-white rounded font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 w-full">
                <h2 className="text-xl font-semibold mb-6 text-blue-800">
                  Manage Photos
                </h2>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Current Photos</h3>
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photos.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Photo ${idx + 1}`}
                            className="h-40 w-full object-cover rounded"
                          />
                          <button
                            onClick={() => handleDeletePhoto(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No photos yet</p>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Add New Photos</h3>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="w-full p-3 border rounded"
                  />
                  <button
                    onClick={handleUploadPhotos}
                    disabled={newPhotos.length === 0}
                    className={`px-6 py-3 rounded font-medium flex items-center gap-2 ${
                      newPhotos.length
                        ? "bg-blue-800 hover:bg-blue-900 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <ImagePlus size={16} />
                    Upload{" "}
                    {newPhotos.length > 0 ? `(${newPhotos.length})` : ""}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">
                Public Preview
              </h2>
              <p className="text-gray-600 mb-4">
                How your establishment appears to visitors
              </p>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-bold text-blue-800 mb-2">
                  {form.nom}
                </h3>

                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin size={16} />
                  <span>
                    {localisations.find((l) => l.id === form.localisation_id)
                      ?.ville || "City"}
                    ,{" "}
                    {localisations.find((l) => l.id === form.localisation_id)
                      ?.quartier || "Neighborhood"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <span className="font-medium">
                    {form.type === "privée" ? "Private" : "Public"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <Phone size={16} />
                  <span>{form.telephone || "Not provided"}</span>
                </div>

                {form.site && (
                  <div className="flex items-center gap-2 text-blue-600 mb-3">
                    <Globe size={16} />
                    <a
                      href={form.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {form.site}
                    </a>
                  </div>
                )}

                {form.formations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.formations.map((f, i) => (
                      <span
                        key={i}
                        className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {form.description && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-1">Description</h4>
                    <p className="text-gray-700">{form.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}