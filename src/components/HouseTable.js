import React from 'react';

import LoadingSpinner from './LoadingSpinner';

const HouseTable = ({
  houses,
  expandedHouse,
  setExpandedHouse,
  onAddMember,
  onEditHouse,
  onDeleteHouse,
  onEditMember,
  onDeleteMember,
  L,
  isAdmin = false,
  isGuest = false,
  loading = false,
}) => {
  const toggleExpand = (houseId) => {
    // Guest mode cannot expand houses
    if (isGuest) return;

    if (expandedHouse === 'all') {
      // if currently expanding all, clicking any toggle will collapse all, then expand this one
      setExpandedHouse(houseId);
      return;
    }
    if (expandedHouse === houseId) {
      setExpandedHouse(null);
    } else {
      setExpandedHouse(houseId);
    }
  };

  const computeDawatSummary = (members) => {
    const chips = [];
    members.forEach((m, index) => {
      const c = m.dawatCounts || {};
      const memberDawats = [];

      // Collect all dawat types for this member
      if (c['3-day'] && c['3-day'] > 0) {
        memberDawats.push(`3d ×${c['3-day']}`);
      }
      if (c['10-day'] && c['10-day'] > 0) {
        memberDawats.push(`10d ×${c['10-day']}`);
      }
      if (c['40-day'] && c['40-day'] > 0) {
        memberDawats.push(`40d ×${c['40-day']}`);
      }
      if (c['4-month'] && c['4-month'] > 0) {
        memberDawats.push(`4m ×${c['4-month']}`);
      }

      // Create a unique key using member properties
      const memberKey = m._id || m.id || `${m.name}-${m.fatherName}-${index}`;

      // Create a chip for every member (including those with Nil dawat)
      if (memberDawats.length > 0) {
        const chipText = memberDawats.join(', ');
        // Use different colors for each member (cycling through 4 colors)
        const colorClasses = ['tag-3d', 'tag-10d', 'tag-40d', 'tag-4m'];
        const colorIndex = chips.length % 4;
        chips.push(
          <span
            key={`${memberKey}-dawat-${index}`}
            className={`tag ${colorClasses[colorIndex]}`}
            style={{ fontWeight: 'normal' }}
          >
            {chipText}
          </span>,
        );
      } else {
        // Member has Nil dawat - create a Nil chip
        chips.push(
          <span
            key={`${memberKey}-dawat-${index}`}
            className={`tag tag-nil`}
            style={{ fontWeight: 'normal' }}
          >
            Nil
          </span>,
        );
      }
    });
    return chips;
  };

  // Removed unused functions to fix warnings

  if (loading) {
    return (
      <div className='card'>
        <LoadingSpinner text='Loading houses...' />
      </div>
    );
  }

  if (!houses || houses.length === 0) {
    return (
      <div
        className='card'
        style={{ textAlign: 'center', padding: '40px 20px' }}
      >
        <h3>📊 No Houses Found</h3>
        <p>
          No houses are currently available. Add some houses to get started!
        </p>
      </div>
    );
  }

  return (
    <div className='card'>
      <div
        className='house-toolbar'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <div className='counts-wrap'>
          <span className='count-chip'>
            <strong>{houses.length}</strong> All Houses
          </span>
          <span className='sep'>|</span>
          <span className='count-chip'>
            <strong>
              {Array.isArray(houses)
                ? houses.reduce(
                    (acc, house) => acc + (house.members?.length || 0),
                    0,
                  )
                : 0}
            </strong>{' '}
            Members Available
          </span>
        </div>
        {!isGuest && (
          <div
            className='house-toolbar-actions small'
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>
              Tip: click the <span className='tag'>▾</span> to expand a house
              and manage members
            </span>
            <button
              className='ghost'
              type='button'
              onClick={() => setExpandedHouse('all')}
              aria-label='Expand all houses'
              title='Expand all houses'
              style={{ marginLeft: 8 }}
            >
              Expand All
            </button>
            <button
              className='ghost'
              type='button'
              onClick={() => setExpandedHouse(null)}
              aria-label='Collapse all houses'
              title='Collapse all houses'
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      <div className='table-responsive'>
        <table id='houseTable' aria-live='polite'>
          <thead>
            <tr>
              <th style={{ width: '200px' }}>House (expand)</th>
              <th>Head</th>
              <th style={{ width: '160px' }}>Father's Name</th>
              <th style={{ width: '120px' }}>Adults</th>
              <th style={{ width: '200px' }}>Dawat Summary</th>
              <th style={{ width: '120px' }}>Street</th>
            </tr>
          </thead>
          <tbody id='houseBody'>
            {Array.isArray(houses)
              ? houses.map((house) => {
                  const members = Array.isArray(house.members)
                    ? house.members
                    : [];
                  const adults = members.filter((m) => m.age >= 14).length;
                  const childCount = members.filter((m) => m.age < 14).length;
                  const head = members.find((m) => m.role === 'Head') || {};

                  return (
                    <React.Fragment key={house._id || house.id}>
                      <tr className='house-row'>
                        <td data-label='House'>
                          {!isGuest && (
                            <span
                              className='expand-icon'
                              onClick={() =>
                                toggleExpand(house._id || house.id)
                              }
                            >
                              {expandedHouse === (house._id || house.id)
                                ? '▴'
                                : '▾'}
                            </span>
                          )}
                          <span
                            style={{
                              fontWeight: 'bold',
                              fontSize: '14px',
                              color: '#1e40af',
                            }}
                          >
                            House {house.number}
                          </span>
                        </td>
                        <td data-label='Head'>{head.name || '-'}</td>
                        <td data-label="Father's Name">
                          {head.fatherName || '-'}
                        </td>
                        <td data-label='Adults'>
                          <div className='adults-chips-container'>
                            <span className='adults-count'>
                              {adults} Adults
                            </span>
                            <span className='child-count'>
                              {childCount}{' '}
                              {childCount === 1 ? 'child' : 'children'}
                            </span>
                          </div>
                        </td>
                        <td data-label='Dawat Summary'>
                          {(() => {
                            // Always use the same data source for consistency
                            const membersToUse =
                              house.displayMembers ||
                              house.matchedMembers ||
                              house.members;
                            const chips = computeDawatSummary(membersToUse);
                            return chips.length ? (
                              <div className='dawat-chips'>{chips}</div>
                            ) : (
                              <span className='tag tag-nil'>Nil</span>
                            );
                          })()}
                        </td>
                        <td data-label='Street'>{house.street}</td>
                      </tr>

                      {!isGuest &&
                        (expandedHouse === 'all' ||
                          expandedHouse === (house._id || house.id)) && (
                          <tr className='member-row'>
                            <td colSpan='6'>
                              <div className='member-table'>
                                <div
                                  style={{
                                    padding: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <div>
                                    <span
                                      style={{
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        color: '#1e40af',
                                      }}
                                    >
                                      Members of House {house.number}
                                    </span>
                                    <span className='small'>
                                      {' '}
                                      (
                                      {house.displayMembers?.length ||
                                        house.matchedMembers?.length ||
                                        house.members.length}{' '}
                                      shown)
                                    </span>
                                  </div>
                                  {isAdmin && (
                                    <div>
                                      <button
                                        className='ghost'
                                        onClick={() =>
                                          onAddMember &&
                                          onAddMember(house._id || house.id)
                                        }
                                      >
                                        ➕ Add Member
                                      </button>
                                      <button
                                        className='ghost'
                                        onClick={() =>
                                          onEditHouse &&
                                          onEditHouse(house._id || house.id)
                                        }
                                      >
                                        ✏️ Edit House
                                      </button>
                                      <button
                                        className='ghost warn'
                                        onClick={() =>
                                          onDeleteHouse &&
                                          onDeleteHouse(house._id || house.id)
                                        }
                                        disabled={loading}
                                        title={
                                          loading
                                            ? 'Deleting...'
                                            : 'Delete this house'
                                        }
                                      >
                                        {loading
                                          ? '⏳ Deleting...'
                                          : '🗑️ Delete House'}
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <table
                                  style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                  }}
                                >
                                  <thead>
                                    <tr
                                      style={{
                                        background: '#f7fff6',
                                        color: '#083d24',
                                      }}
                                    >
                                      <th style={{ width: '120px' }}>Name</th>
                                      <th style={{ width: '180px' }}>
                                        Father's Name
                                      </th>
                                      <th style={{ width: '60px' }}>Age</th>
                                      <th style={{ width: '90px' }}>Gender</th>
                                      <th style={{ width: '120px' }}>
                                        Occupation
                                      </th>
                                      <th style={{ width: '120px' }}>
                                        Education
                                      </th>
                                      <th style={{ width: '110px' }}>Quran</th>
                                      <th style={{ width: '110px' }}>Maktab</th>
                                      <th style={{ width: '110px' }}>Dawat</th>
                                      <th style={{ width: '120px' }}>Mobile</th>
                                      <th style={{ width: '120px' }}>
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      // Always use the same data source for consistency
                                      const membersToUse =
                                        house.displayMembers ||
                                        house.matchedMembers ||
                                        house.members ||
                                        [];
                                      return Array.isArray(membersToUse)
                                        ? membersToUse.map((member, index) => (
                                            <tr
                                              key={
                                                member._id ||
                                                member.id ||
                                                `${member.name}-${member.fatherName}-${index}`
                                              }
                                            >
                                              <td data-label='Name'>
                                                {member.name}
                                              </td>
                                              <td data-label="Father's Name">
                                                {member.fatherName || '-'}
                                              </td>
                                              <td data-label='Age'>
                                                {member.age}
                                              </td>
                                              <td data-label='Gender'>
                                                {member.gender}
                                              </td>
                                              <td data-label='Occupation'>
                                                {member.occupation}
                                              </td>
                                              <td data-label='Education'>
                                                {member.education}
                                              </td>
                                              <td data-label='Quran'>
                                                {member.quran || 'no'}
                                              </td>
                                              <td data-label='Maktab'>
                                                {Number(member.age) < 14
                                                  ? member.maktab === 'yes'
                                                    ? 'Yes'
                                                    : 'No'
                                                  : '-'}
                                              </td>
                                              <td data-label='Dawat'>
                                                {(() => {
                                                  const dawatCounts =
                                                    member.dawatCounts || {};
                                                  const memberDawats = [];

                                                  // Collect all dawat types for this member
                                                  if (
                                                    dawatCounts['3-day'] &&
                                                    dawatCounts['3-day'] > 0
                                                  ) {
                                                    memberDawats.push(
                                                      `3day ×${dawatCounts['3-day']}`,
                                                    );
                                                  }
                                                  if (
                                                    dawatCounts['10-day'] &&
                                                    dawatCounts['10-day'] > 0
                                                  ) {
                                                    memberDawats.push(
                                                      `10day ×${dawatCounts['10-day']}`,
                                                    );
                                                  }
                                                  if (
                                                    dawatCounts['40-day'] &&
                                                    dawatCounts['40-day'] > 0
                                                  ) {
                                                    memberDawats.push(
                                                      `40day ×${dawatCounts['40-day']}`,
                                                    );
                                                  }
                                                  if (
                                                    dawatCounts['4-month'] &&
                                                    dawatCounts['4-month'] > 0
                                                  ) {
                                                    memberDawats.push(
                                                      `4month ×${dawatCounts['4-month']}`,
                                                    );
                                                  }

                                                  if (memberDawats.length > 0) {
                                                    return (
                                                      <span className='dawat-status'>
                                                        {memberDawats.join(
                                                          ', ',
                                                        )}
                                                      </span>
                                                    );
                                                  } else {
                                                    return (
                                                      <span className='dawat-status nil'>
                                                        {member.dawat || 'Nil'}
                                                      </span>
                                                    );
                                                  }
                                                })()}
                                              </td>
                                              <td data-label='Mobile'>
                                                {isAdmin
                                                  ? member.mobile || ''
                                                  : 'Hidden'}
                                              </td>
                                              <td data-label='Actions'>
                                                {isAdmin && (
                                                  <div
                                                    style={{
                                                      display: 'flex',
                                                      gap: '4px',
                                                      justifyContent:
                                                        'flex-end',
                                                    }}
                                                  >
                                                    <button
                                                      onClick={() =>
                                                        onEditMember &&
                                                        onEditMember(
                                                          house._id || house.id,
                                                          member._id ||
                                                            member.id,
                                                        )
                                                      }
                                                    >
                                                      ✏️
                                                    </button>
                                                    <button
                                                      className='warn'
                                                      onClick={() =>
                                                        onDeleteMember &&
                                                        onDeleteMember(
                                                          member._id ||
                                                            member.id,
                                                          house._id || house.id,
                                                        )
                                                      }
                                                      disabled={loading}
                                                      title={
                                                        loading
                                                          ? 'Deleting...'
                                                          : 'Delete this member'
                                                      }
                                                    >
                                                      {loading ? '⏳' : '🗑️'}
                                                    </button>
                                                  </div>
                                                )}
                                              </td>
                                            </tr>
                                          ))
                                        : null;
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(HouseTable);
