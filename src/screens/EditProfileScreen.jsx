import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  X,
  MapPin,
  Instagram,
  Activity,
  Linkedin,
  Check,
  Save,
} from 'lucide-react';
import { photoService } from '../services/photoService';

export default function EditProfileScreen({ user, onSave, onBack }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    bio: user?.bio || '',
    jobTitle: user?.jobTitle || '',
    company: user?.company || '',
    education: user?.education || '',
    location: user?.location || '',
    interests: user?.interests || [],
    instagram: {
      connected: user?.instagram?.connected || false,
      handle: user?.instagram?.handle || '',
    },
    strava: {
      connected: user?.strava?.connected || false,
    },
    linkedin: {
      connected: user?.linkedin?.connected || false,
    },
  });

  const [photos, setPhotos] = useState(user?.photos || []);
  const [interestInput, setInterestInput] = useState('');
  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBioChange = (e) => {
    const value = e.target.value.slice(0, 200);
    setFormData((prev) => ({
      ...prev,
      bio: value,
    }));
  };

  const handlePhotoClick = (index) => {
    fileInputRef.current?.click();
    fileInputRef.current.dataset.slotIndex = index;
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const slotIndex = parseInt(fileInputRef.current.dataset.slotIndex || '0');

    try {
      const compressed = await photoService.compressImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[slotIndex] = dataUrl;
          return newPhotos;
        });
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      console.error('Error processing photo:', error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddInterest = () => {
    const trimmedInput = interestInput.trim();
    if (trimmedInput && formData.interests.length < 8) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, trimmedInput],
      }));
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (index) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index),
    }));
  };

  const handleInterestKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest();
    }
  };

  const handleToggleApp = (app) => {
    setFormData((prev) => ({
      ...prev,
      [app]: {
        ...prev[app],
        connected: !prev[app].connected,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = {
        ...user,
        ...formData,
        photos,
      };
      await onSave(updatedUser);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a12' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10" style={{ backgroundColor: '#0a0a12' }}>
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition">
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-xl font-semibold text-white">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-2 rounded-lg transition font-semibold flex items-center gap-2"
          style={{
            backgroundColor: '#3ecfcf',
            color: '#0a0a12',
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          <Save size={20} />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-20">
        {/* Photo Grid Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Your Photos</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Main Photo - Large Slot */}
            <div
              className="col-span-2 relative rounded-xl overflow-hidden cursor-pointer group h-48"
              onClick={() => handlePhotoClick(0)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: photos[0] ? '2px solid transparent' : '2px dashed rgba(255, 255, 255, 0.2)',
                backgroundImage: photos[0] ? `url(${photos[0]})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {photos[0] && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, #e8475f, #3ecfcf)',
                    opacity: 0.2,
                    pointerEvents: 'none',
                  }}
                />
              )}
              {!photos[0] && (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <Plus size={32} className="text-white/60 mb-2" />
                  <p className="text-white/60 text-sm">Add Main Photo</p>
                </div>
              )}
              {photos[0] && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(0);
                    }}
                    className="p-2 rounded-lg transition"
                    style={{ backgroundColor: '#e8475f' }}
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Secondary Photos - Smaller Slots */}
            {[1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className="relative rounded-lg overflow-hidden cursor-pointer group h-32"
                onClick={() => handlePhotoClick(index)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: photos[index] ? '1px solid rgba(255, 255, 255, 0.1)' : '1px dashed rgba(255, 255, 255, 0.2)',
                  backgroundImage: photos[index] ? `url(${photos[index]})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!photos[index] && (
                  <div className="flex items-center justify-center w-full h-full">
                    <Plus size={24} className="text-white/60" />
                  </div>
                )}
                {photos[index] && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(index);
                      }}
                      className="p-1 rounded transition"
                      style={{ backgroundColor: '#e8475f' }}
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

        {/* Form Fields Section */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg text-white transition focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                focusRing: '#3ecfcf',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3ecfcf')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              min="18"
              max="120"
              className="w-full px-4 py-2 rounded-lg text-white transition focus:outline-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3ecfcf')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>

          {/* Bio */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-white/80">Bio</label>
              <span className="text-xs text-white/60">{formData.bio.length}/200</span>
            </div>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleBioChange}
              rows="3"
              className="w-full px-4 py-2 rounded-lg text-white resize-none transition focus:outline-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3ecfcf')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Job Title</label>
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg text-white transition focus:outline-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3ecfcf')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Company</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg text-white transition focus:outline-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3ecfcf')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>

          {/* Education */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Education</label>
            <input
              type="text"
              name="education"
              value={formData.education}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg text-white transition focus:outline-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3ecfcf')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
              <MapPin size={16} />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg text-white transition focus:outline-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3ecfcf')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>
        </div>

        {/* Interests Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Interests</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyPress={handleInterestKeyPress}
              placeholder="Add an interest..."
              className="flex-1 px-4 py-2 rounded-lg text-white transition focus:outline-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3ecfcf')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
            <button
              onClick={handleAddInterest}
              disabled={formData.interests.length >= 8}
              className="px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
              style={{ backgroundColor: '#3ecfcf', color: '#0a0a12' }}
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.interests.map((interest, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm"
                style={{ backgroundColor: 'rgba(62, 207, 207, 0.2)', border: '1px solid #3ecfcf' }}
              >
                {interest}
                <button
                  onClick={() => handleRemoveInterest(index)}
                  className="p-0.5 hover:bg-white/10 rounded transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/60 mt-2">
            {formData.interests.length}/8 interests
          </p>
        </div>

        {/* Connected Apps Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Connected Apps</h2>
          <div className="space-y-3">
            {/* Instagram */}
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              <div className="flex items-center gap-3">
                <Instagram size={20} style={{ color: '#3ecfcf' }} />
                <div>
                  <p className="text-white font-medium">Instagram</p>
                  {formData.instagram.connected && (
                    <p className="text-xs text-white/60">@{formData.instagram.handle}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleToggleApp('instagram')}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition"
                style={{
                  backgroundColor: formData.instagram.connected ? '#34d399' : 'rgba(255, 255, 255, 0.1)',
                  color: formData.instagram.connected ? '#0a0a12' : 'white',
                }}
              >
                {formData.instagram.connected ? 'Connected' : 'Connect'}
              </button>
            </div>

            {/* Strava */}
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              <div className="flex items-center gap-3">
                <Activity size={20} style={{ color: '#3ecfcf' }} />
                <div>
                  <p className="text-white font-medium">Strava</p>
                  {formData.strava.connected && (
                    <p className="text-xs text-white/60">Activity Tracking</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleToggleApp('strava')}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition"
                style={{
                  backgroundColor: formData.strava.connected ? '#34d399' : 'rgba(255, 255, 255, 0.1)',
                  color: formData.strava.connected ? '#0a0a12' : 'white',
                }}
              >
                {formData.strava.connected ? 'Connected' : 'Connect'}
              </button>
            </div>

            {/* LinkedIn */}
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              <div className="flex items-center gap-3">
                <Linkedin size={20} style={{ color: '#3ecfcf' }} />
                <div>
                  <p className="text-white font-medium">LinkedIn</p>
                  {formData.linkedin.connected && (
                    <p className="text-xs text-white/60">Professional Profile</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleToggleApp('linkedin')}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition"
                style={{
                  backgroundColor: formData.linkedin.connected ? '#34d399' : 'rgba(255, 255, 255, 0.1)',
                  color: formData.linkedin.connected ? '#0a0a12' : 'white',
                }}
              >
                {formData.linkedin.connected ? 'Connected' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
