// BUGDOC: Member-level filtering was missing; members array unfiltered render ho rahi thi.

/** @typedef {{ id: string|number, name: string, gender?: string, phone?: string, age?: number, jamaat?: string, occupation?: string, education?: string, quran?: string, maktab?: string, dawat?: string, dawatCounts?: object, fatherName?: string }} Member */
/** @typedef {{ id: string|number, number?: string, houseName?: string, street?: string, members: Member[] }} House */

const norm = (v) => (v || '').toString().trim().toLowerCase();

export function matchesGender(member, selectedGender) {
  if (!selectedGender) return true;
  const g = norm(member.gender);
  const s = norm(selectedGender);
  // handle variations: male/m, female/f
  if (s === 'male' || s === 'm') return g === 'male' || g === 'm';
  if (s === 'female' || s === 'f') return g === 'female' || g === 'f';
  return g === s;
}

export function matchesSearch(member, term) {
  if (!term) return true;
  const q = norm(term);
  return [member.name, member.fatherName, member.phone, member.occupation]
    .filter(Boolean)
    .some((v) => norm(v).includes(q));
}

export function matchesOccupation(member, selectedOccupation) {
  if (!selectedOccupation) return true;
  if (selectedOccupation === 'Child') {
    return Number(member.age) < 14;
  }
  return norm(member.occupation) === norm(selectedOccupation);
}

export function matchesEducation(member, selectedEducation) {
  if (!selectedEducation) return true;
  return norm(member.education) === norm(selectedEducation);
}

export function matchesQuran(member, selectedQuran) {
  if (!selectedQuran) return true;
  return norm(member.quran) === norm(selectedQuran);
}

export function matchesMaktab(member, selectedMaktab) {
  if (!selectedMaktab) return true;
  const isChild = Number(member.age) < 14;
  if (!isChild) return false;
  const mk = member.maktab === 'yes' ? 'yes' : 'no';
  return mk === selectedMaktab;
}

export function matchesDawat(member, selectedDawat) {
  if (!selectedDawat) return true;
  const c = member.dawatCounts || {};
  const sumCounts =
    (c['3-day'] || 0) +
    (c['10-day'] || 0) +
    (c['40-day'] || 0) +
    (c['4-month'] || 0);

  if (selectedDawat === 'Nil') {
    return sumCounts === 0;
  } else {
    const hasCountForType = (c[selectedDawat] || 0) > 0;
    return member.dawat === selectedDawat || hasCountForType;
  }
}

export function matchesDawatCount(member, dawatCountKey, dawatCountTimes) {
  if (!dawatCountKey) return true;

  const c = member.dawatCounts || {};

  if (dawatCountTimes !== '' && dawatCountTimes !== undefined) {
    // Exact count match
    return (c[dawatCountKey] || 0) === parseInt(dawatCountTimes);
  } else {
    // Any count > 0
    return (c[dawatCountKey] || 0) > 0;
  }
}

export function matchesAge(member, ageRange) {
  if (!ageRange) return true;

  const a = Number(member.age);
  if (Number.isNaN(a)) return false;

  // Check minAge
  if (ageRange.min != null && ageRange.min !== '' && a < Number(ageRange.min)) {
    return false;
  }

  // Check maxAge
  if (ageRange.max != null && ageRange.max !== '' && a > Number(ageRange.max)) {
    return false;
  }

  return true;
}

export function matchesBaligh(member, selectedBaligh) {
  if (!selectedBaligh) return true;
  if (selectedBaligh === 'yes') {
    return member.gender === 'Male' && member.age >= 14;
  } else if (selectedBaligh === 'no') {
    return !(member.gender === 'Male' && member.age >= 14);
  }
  return true;
}

export function matchesStreet(house, selectedStreet) {
  if (!selectedStreet) return true;
  return norm(house.street) === norm(selectedStreet);
}

export function matchesAll(member, filters, house = null) {
  const {
    gender,
    q: search,
    occupation,
    education,
    quran,
    maktab,
    dawat,
    minAge,
    maxAge,
    baligh,
    street,
    dawatCountKey,
    dawatCountTimes,
  } = filters || {};

  // Create age range only if minAge or maxAge has actual values
  const ageRange =
    (minAge && minAge !== '') || (maxAge && maxAge !== '')
      ? { min: minAge, max: maxAge }
      : null;

  return (
    matchesGender(member, gender) &&
    matchesSearch(member, search) &&
    matchesOccupation(member, occupation) &&
    matchesEducation(member, education) &&
    matchesQuran(member, quran) &&
    matchesMaktab(member, maktab) &&
    matchesDawat(member, dawat) &&
    matchesDawatCount(member, dawatCountKey, dawatCountTimes) &&
    matchesAge(member, ageRange) &&
    matchesBaligh(member, baligh) &&
    (house ? matchesStreet(house, street) : true)
  );
}

// Core pipeline: Apply member-level filtering
export function applyMemberFilters(houses, filters) {
  const safeHouses = Array.isArray(houses) ? houses : [];

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters || {}).some(
    (value) => value !== '' && value !== null && value !== undefined,
  );

  return (
    safeHouses
      .map((h) => ({
        ...h,
        // IMPORTANT: filter members INSIDE the house
        members: Array.isArray(h.members)
          ? h.members.filter((m) => matchesAll(m, filters, h))
          : [],
      }))
      // Keep houses that have members OR if no filters are active (show empty houses too)
      .filter((h) => h.members.length > 0 || !hasActiveFilters)
  );
}

// House-level filtering (for search by house number/street)
export function applyHouseFilters(houses, filters) {
  const safeHouses = Array.isArray(houses) ? houses : [];
  const { q: searchTerm } = filters || {};

  if (!searchTerm) return safeHouses;

  const searchLower = searchTerm.toLowerCase();

  return safeHouses.filter((house) => {
    // Check house number match
    const houseNumberMatch =
      String(house.number || '').toString() === searchTerm ||
      String(house.number || '')
        .toString()
        .startsWith(searchTerm);

    // Check street match
    const streetMatch =
      house.street && house.street.toLowerCase().includes(searchLower);

    return houseNumberMatch || streetMatch;
  });
}

// Combined filtering: House + Member level
export function applyCombinedFilters(houses, filters) {
  const safeHouses = Array.isArray(houses) ? houses : [];
  const { q: searchTerm } = filters || {};

  if (!searchTerm) {
    // No search term, just apply member-level filters
    return applyMemberFilters(safeHouses, filters);
  }

  const searchLower = searchTerm.toLowerCase();

  return safeHouses
    .map((house) => {
      // Check if this is a house-level search (house number/street)
      const houseNumberMatch =
        String(house.number || '').toString() === searchTerm ||
        String(house.number || '')
          .toString()
          .startsWith(searchTerm);

      const streetMatch =
        house.street && house.street.toLowerCase().includes(searchLower);

      const isHouseLevelSearch = houseNumberMatch || streetMatch;

      if (isHouseLevelSearch) {
        // House-level search: show all members of this house
        return {
          ...house,
          members: house.members || [],
        };
      } else {
        // Member-level search: filter members by name
        const filteredMembers = (house.members || []).filter((member) => {
          return matchesSearch(member, searchTerm);
        });

        return {
          ...house,
          members: filteredMembers,
        };
      }
    })
    .filter((house) => house.members.length > 0) // Keep only houses with members
    .map((house) => {
      // Apply other filters (gender, age, occupation, etc.) to the members
      const otherFilters = { ...filters };
      delete otherFilters.q; // Remove search term as it's already applied

      return {
        ...house,
        members: (house.members || []).filter((member) =>
          matchesAll(member, otherFilters, house),
        ),
      };
    })
    .filter((house) => house.members.length > 0); // Keep only houses with matching members
}
