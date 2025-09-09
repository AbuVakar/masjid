import { useState, useCallback, useMemo } from 'react';
import { applyCombinedFilters } from '../utils/filters';

export const useFilters = (houses = []) => {
  const [filters, setFilters] = useState({
    q: '',
    street: '',
    occupation: '',
    dawat: '',
    education: '',
    quran: '',
    maktab: '',
    gender: '',
    minAge: '',
    maxAge: '',
    baligh: '',
    dawatCountKey: '',
    dawatCountTimes: '',
  });

  // Ensure filters object never has undefined values
  const safeSetFilters = useCallback(
    (newFilters) => {
      if (typeof newFilters === 'function') {
        // Handle function updates
        setFilters((prevFilters) => {
          const updatedFilters = newFilters(prevFilters);
          const safeFilters = {};
          Object.keys(prevFilters).forEach((key) => {
            safeFilters[key] = updatedFilters[key] || '';
          });
          return safeFilters;
        });
      } else {
        // Handle direct object updates
        const safeFilters = {};
        Object.keys(filters).forEach((key) => {
          safeFilters[key] = newFilters[key] || '';
        });
        setFilters(safeFilters);
      }
    },
    [filters],
  );

  const filteredHouses = useMemo(() => {
    if (!houses || houses.length === 0) {
      console.log('No houses data available for filtering');
      return [];
    }

    console.log('Starting filtering with', houses.length, 'houses');
    console.log('Current filters:', filters);

    // Use the new centralized filtering logic
    const result = applyCombinedFilters(houses, filters);

    console.log('Filtered result:', result.length, 'houses');

    // Add displayMembers for backward compatibility
    return result.map((house) => ({
      ...house,
      displayMembers: house.members,
      matchedMembers: house.members,
    }));
  }, [houses, filters]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      q: '',
      street: '',
      occupation: '',
      dawat: '',
      education: '',
      quran: '',
      maktab: '',
      gender: '',
      minAge: '',
      maxAge: '',
      baligh: '',
      dawatCountKey: '',
      dawatCountTimes: '',
    };
    setFilters(defaultFilters);
  }, [setFilters]);

  // Get unique streets for dropdown
  const streets = useMemo(() => {
    const streetSet = new Set();
    if (houses && Array.isArray(houses)) {
      houses.forEach((house) => streetSet.add(house.street));
    }
    return Array.from(streetSet).sort();
  }, [houses]);

  // Get unique occupations for dropdown
  const occupations = useMemo(() => {
    const occupationSet = new Set();
    if (houses && Array.isArray(houses)) {
      houses.forEach((house) => {
        if (house.members && Array.isArray(house.members)) {
          house.members.forEach((member) => {
            if (member.occupation) {
              occupationSet.add(member.occupation);
            }
          });
        }
      });
    }
    return Array.from(occupationSet).sort();
  }, [houses]);

  return {
    filters,
    setFilters: safeSetFilters,
    filteredHouses,
    resetFilters,
    streets,
    occupations,
  };
};
