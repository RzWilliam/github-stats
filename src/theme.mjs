// Color themes. "radical" mirrors the look of the original card.
// Add your own freely by copying a block.

export const themes = {
  radical: {
    title: "#fe428e",
    text: "#a9fef7",
    icon: "#f8d847",
    bg: "#141321",
    border: "#e4e2e2",
    accent: "#fe428e",
    chart: "#a371f7",
  },
  dark: {
    title: "#58a6ff",
    text: "#c9d1d9",
    icon: "#79c0ff",
    bg: "#0d1117",
    border: "#30363d",
    accent: "#58a6ff",
    chart: "#58a6ff",
  },
  dracula: {
    title: "#ff6e96",
    text: "#f8f8f2",
    icon: "#79dafa",
    bg: "#282a36",
    border: "#44475a",
    accent: "#bd93f9",
    chart: "#bd93f9",
  },
  tokyonight: {
    title: "#70a5fd",
    text: "#a9b1d6",
    icon: "#bf91f3",
    bg: "#1a1b27",
    border: "#414868",
    accent: "#38bdae",
    chart: "#bf91f3",
  },
  light: {
    title: "#0969da",
    text: "#1f2328",
    icon: "#0969da",
    bg: "#ffffff",
    border: "#d0d7de",
    accent: "#0969da",
    chart: "#8250df",
  },
};

export function getTheme(name) {
  return themes[name] || themes.radical;
}
