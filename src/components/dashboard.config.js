import {
  FaUsers,
  FaGraduationCap,
  FaCalendarAlt,
  FaHome,
  FaFilePdf,
} from 'react-icons/fa';

export const getDashboardCards = (stats, onNavigate) => [
  {
    title: 'Religious Education',
    description: 'Islamic education and learning statistics',
    icon: FaGraduationCap,
    color: 'green',
    count: stats.totalHafiz + stats.totalUlma + stats.totalAdults,
    primaryAction: 'education',
    items: [
      {
        title: 'Total Hafiz',
        description: 'Members who have memorized Quran',
        icon: '📖',
        action: 'members',
      },
      {
        title: 'Total Ulma',
        description: 'Islamic scholars and learned members',
        icon: '🎓',
        action: 'members',
      },
      {
        title: 'Total Adults',
        description: 'Members aged 18 and above',
        icon: '👥',
        action: 'members',
      },
    ],
  },
  {
    title: 'Jamaat Activities',
    description: 'Community participation and activities',
    icon: FaCalendarAlt,
    color: 'orange',
    count:
      stats.total3Days +
      stats.total10Days +
      stats.total40Days +
      stats.total4Months,
    primaryAction: 'jamaat',
    items: [
      {
        title: '3 Days Jamaat',
        description: 'Short-term jamaat participants',
        icon: '📅',
        action: 'members',
      },
      {
        title: '10 Days Jamaat',
        description: 'Medium-term jamaat participants',
        icon: '📆',
        action: 'members',
      },
      {
        title: '40 Days Jamaat',
        description: 'Extended jamaat participants',
        icon: '🗓️',
        action: 'members',
      },
    ],
  },
  {
    title: 'Community Resources',
    description: 'Educational materials and resources',
    icon: FaFilePdf,
    color: 'purple',
    count: stats.totalResources,
    primaryAction: 'resources',
    items: [
      {
        title: 'PDF Documents',
        description: 'Islamic literature and guides',
        icon: '📄',
        action: 'resources',
      },
      {
        title: 'Audio Resources',
        description: 'Lectures and recitations',
        icon: '🎵',
        action: 'resources',
      },
      {
        title: 'Video Content',
        description: 'Educational videos and lectures',
        icon: '🎥',
        action: 'resources',
      },
    ],
  },
  {
    title: 'House Management',
    description: 'Community housing and organization',
    icon: FaHome,
    color: 'cyan',
    count: stats.totalHouses,
    primaryAction: 'houses',
    items: [
      {
        title: 'Total Houses',
        description: 'Registered community houses',
        icon: '🏠',
        action: 'houses',
      },
      {
        title: 'Active Members',
        description: 'Currently active community members',
        icon: '👨‍👩‍👧‍👦',
        action: 'members',
      },
      {
        title: 'House Leaders',
        description: 'Designated house representatives',
        icon: '👨‍💼',
        action: 'members',
      },
    ],
  },
];

export const getSummaryStats = (stats, houses, members) => [
  {
    title: 'Total Members',
    value: members.flatMap((houseMembers) => houseMembers || []).length,
    icon: FaUsers,
    color: 'blue',
    activeCount: members.flatMap((houseMembers) => houseMembers || []).length,
  },
  {
    title: 'Total Houses',
    value: houses.length,
    icon: FaHome,
    color: 'green',
    activeCount: houses.length,
  },
  {
    title: 'Total Resources',
    value: stats.totalResources,
    icon: FaFilePdf,
    color: 'purple',
    activeCount: stats.totalResources,
  },
  {
    title: 'Active Jamaat',
    value:
      stats.total3Days +
      stats.total10Days +
      stats.total40Days +
      stats.total4Months,
    icon: FaCalendarAlt,
    color: 'orange',
    activeCount:
      stats.total3Days +
      stats.total10Days +
      stats.total40Days +
      stats.total4Months,
  },
];
