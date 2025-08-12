import { useState, useEffect, useContext, createContext } from "react";

// the more modern version of context. empty context + custom hook

const DarkModeContext = createContext(); //empty context

//custom hook
export const DarkModeContextProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
    // this checks for the value (bool) stored under darkMode. if its true, then === is also true so it sets darkMode. and false === true will give false obv, so it activates lightMode.
  });

  useEffect(() => {
    const root = document.documentElement; //the <html> tag
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);
  // the dependency is darkMode so it runs every time it changes. and once on mount. it basically gives the class dark to the html tag. which tells every class in between to enable darkmode styling

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export function useDarkMode() {
  return useContext(DarkModeContext);
}
