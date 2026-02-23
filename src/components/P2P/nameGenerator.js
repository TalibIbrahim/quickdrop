const colors = [
  "Cyan",
  "Indigo",
  "Emerald",
  "Amber",
  "Crimson",
  "Violet",
  "Cobalt",
  "Maroon",
  "Turquoise",
  "Red",
  "Green",
  "Blue",
  "Gold",
  "Silver",
];

const animals = [
  "Fox",
  "Bear",
  "Panda",
  "Wolf",
  "Owl",
  "Tiger",
  "Falcon",
  "Dolphin",
  "Octopus",
  "Platypus",
  "Eagle",
  "Panther",
];

export const generateRandomUser = () => {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];

  return {
    name: `${color} ${animal}`,
    color: color.toLowerCase(),
  };
};
