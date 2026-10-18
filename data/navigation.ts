export interface NavItem {
  id: string;
  label: string;
}

/** Section ids double as anchor targets (`#id`). */
export const navItems: NavItem[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "expertise", label: "Expertise" },
  { id: "projects", label: "Projects" },
  { id: "lab", label: "AI Lab" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];
