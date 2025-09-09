import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaTimes,
  FaPhone,
  FaUser,
  FaEdit,
  FaTrash,
  FaPlus,
} from 'react-icons/fa';
import { useNotify } from '../context/NotificationContext';
import { useUser } from '../context/UserContext';
import apiService from '../services/api';

// Individual contact component to prevent unnecessary re-renders
const ContactItem = React.memo(
  ({ contact, index, isEditing, onContactChange, onRemoveContact }) => {
    console.log(`ContactItem ${index} - isEditing:`, isEditing);
    console.log(`ContactItem ${index} - contact:`, contact);

    return (
      <div className='contact-item'>
        {isEditing ? (
          <div className='contact-edit-form'>
            <div className='form-group'>
              <label>
                <FaUser className='input-icon' />
                Contact Name
              </label>
              <input
                type='text'
                value={contact.name || ''}
                onChange={(e) => {
                  console.log(
                    `ContactItem ${index} - name change:`,
                    e.target.value,
                  );
                  onContactChange(index, 'name', e.target.value);
                }}
                placeholder='Enter contact name'
                className='contact-input'
              />
            </div>
            <div className='form-group'>
              <label>
                <FaPhone className='input-icon' />
                Mobile Number
              </label>
              <input
                type='tel'
                value={contact.mobile || ''}
                onChange={(e) => {
                  console.log(
                    `ContactItem ${index} - mobile change:`,
                    e.target.value,
                  );
                  onContactChange(index, 'mobile', e.target.value);
                }}
                placeholder='Enter mobile number'
                className='contact-input'
              />
            </div>
            <button
              onClick={() => {
                console.log(`ContactItem ${index} - remove clicked`);
                onRemoveContact(index);
              }}
              className='remove-btn'
              title='Remove contact'
            >
              <FaTrash />
            </button>
          </div>
        ) : (
          <div className='contact-display'>
            <div className='contact-name'>
              <FaUser className='contact-icon' />
              {contact.name || 'No name'}
            </div>
            <div className='contact-mobile'>
              <FaPhone className='contact-icon' />
              {contact.mobile || 'No mobile'}
            </div>
          </div>
        )}
      </div>
    );
  },
);

const ContactListModal = ({ isOpen, onClose }) => {
  const [contacts, setContacts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { notify } = useNotify();
  const { isAdmin } = useUser();

  // Default contacts data - moved outside component to prevent recreation
  const defaultContacts = useMemo(
    () => [
      { name: 'M/s Ji Mursaleen Sahab', mobile: '+91-9639874789' },
      { name: 'Haroon Bhai', mobile: '+91-9568094910' },
      { name: 'Imaam Sahab', mobile: '+91-9760253216' },
    ],
    [],
  );

  // Initialize contacts immediately when modal opens
  useEffect(() => {
    if (isOpen && contacts.length === 0) {
      setContacts(defaultContacts);
    }
  }, [isOpen, contacts.length, defaultContacts]);

  // Load contacts from API only once when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadContacts = async () => {
        try {
          const response = await apiService.get('/info-data?type=contact');
          if (response && response.items && response.items.length > 0) {
            setContacts(response.items);
          }
        } catch (error) {
          console.error('Error loading contacts:', error);
          // Keep default contacts on error
        }
      };
      loadContacts();
    }
  }, [isOpen]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Reset states when component unmounts
      setContacts([]);
      setIsEditing(false);
      setIsSaving(false);
    };
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleEdit = useCallback(() => {
    console.log('handleEdit called - isAdmin:', isAdmin);
    if (!isAdmin) {
      notify('Only admin can edit contacts', { type: 'error' });
      return;
    }
    console.log('Setting isEditing to true');
    setIsEditing(true);
  }, [isAdmin, notify]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    // Reset to default contacts
    setContacts(defaultContacts);
  }, [defaultContacts]);

  const handleSave = useCallback(async () => {
    if (!isAdmin) {
      notify('Only admin can save contacts', { type: 'error' });
      return;
    }

    // Validate contacts
    const nonEmptyContacts = contacts.filter(
      (contact) => contact.name?.trim() || contact.mobile?.trim(),
    );

    const hasIncompleteContacts = nonEmptyContacts.some(
      (contact) => !contact.name?.trim() || !contact.mobile?.trim(),
    );

    if (hasIncompleteContacts) {
      notify('Please fill in both name and mobile number for all contacts', {
        type: 'error',
      });
      return;
    }

    if (nonEmptyContacts.length === 0) {
      notify('Please add at least one contact', { type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        type: 'contact',
        title: 'Contact Information',
        items: nonEmptyContacts.map((contact) => ({
          name: contact.name?.trim() || '',
          mobile: contact.mobile?.trim() || '',
        })),
      };

      console.log('Saving contacts payload:', payload);
      const response = await apiService.post('/info-data', payload);
      console.log('Save response:', response);

      notify('Contacts saved successfully!', { type: 'success' });
      setIsEditing(false);

      // Update contacts with saved data
      setContacts(nonEmptyContacts);
    } catch (error) {
      console.error('Error saving contacts:', error);
      console.error('Error details:', error.response?.data || error.message);
      notify(
        `Failed to save contacts: ${error.response?.data?.message || error.message}`,
        { type: 'error' },
      );
    } finally {
      setIsSaving(false);
    }
  }, [isAdmin, notify, contacts]);

  const handleContactChange = useCallback((index, field, value) => {
    console.log(
      `handleContactChange - index: ${index}, field: ${field}, value: ${value}`,
    );
    setContacts((prevContacts) => {
      const updatedContacts = [...prevContacts];
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value,
      };
      console.log('Updated contacts:', updatedContacts);
      return updatedContacts;
    });
  }, []);

  const handleAddContact = useCallback(() => {
    setContacts((prevContacts) => [...prevContacts, { name: '', mobile: '' }]);
  }, []);

  const handleRemoveContact = useCallback(
    (index) => {
      if (contacts.length > 1) {
        setContacts((prevContacts) =>
          prevContacts.filter((_, i) => i !== index),
        );
      } else {
        notify('At least one contact is required', { type: 'error' });
      }
    },
    [contacts.length, notify],
  );

  // Debug logging for edit functionality
  useEffect(() => {
    console.log('ContactListModal - isEditing:', isEditing);
    console.log('ContactListModal - contacts:', contacts);
    console.log('ContactListModal - isAdmin:', isAdmin);
  }, [isEditing, contacts, isAdmin]);

  if (!isOpen) return null;

  return (
    <div className='modal-backdrop'>
      <div className='modal contact-modal'>
        <div className='modal-header'>
          <h2>
            <FaPhone className='modal-icon' />
            Contact List
          </h2>
          <button className='modal-close' onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className='modal-content'>
          {/* Contact List */}
          <div className='contact-list'>
            {contacts.length > 0 ? (
              contacts.map((contact, index) => (
                <ContactItem
                  key={`contact-${index}`}
                  contact={contact}
                  index={index}
                  isEditing={isEditing}
                  onContactChange={handleContactChange}
                  onRemoveContact={handleRemoveContact}
                />
              ))
            ) : (
              <div className='no-contacts'>
                <FaPhone className='no-contacts-icon' />
                <p>No contacts found</p>
                {isEditing && (
                  <p className='no-contacts-hint'>
                    Click "Add New Contact" to add contacts
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Add Contact Button (only in edit mode) */}
          {isEditing && (
            <button onClick={handleAddContact} className='add-contact-btn'>
              <FaPlus />
              Add New Contact
            </button>
          )}
        </div>

        <div className='modal-footer'>
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className='btn btn-secondary'
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className='btn btn-primary'
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              {isAdmin && (
                <button onClick={handleEdit} className='btn btn-primary'>
                  <FaEdit />
                  Edit Contacts
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ContactListModal);
