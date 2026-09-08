export const AVATARS = [
  { id: "astronauta", emoji: "🧑‍🚀", label: "Astronauta" },
  { id: "artista", emoji: "🧑‍🎨", label: "Artista" },
  { id: "cientifico", emoji: "🧑‍🔬", label: "Científico" },
  { id: "cocinero", emoji: "🧑‍🍳", label: "Cocinero" },
  { id: "robot", emoji: "🤖", label: "Robot" },
  { id: "detective", emoji: "🕵️", label: "Detective" },
  { id: "mago", emoji: "🧙", label: "Mago" },
  { id: "superhero", emoji: "🦸", label: "Superhéroe" },
  { id: "ninja", emoji: "🥷", label: "Ninja" },
  { id: "exploradora", emoji: "🧭", label: "Exploradora" },
  { id: "dinosaurio", emoji: "🦕", label: "Dinosaurio" },
  { id: "unicornio", emoji: "🦄", label: "Unicornio" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export function getAvatar(id: string) {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
