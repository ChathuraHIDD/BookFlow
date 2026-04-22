export const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "admin", label: "Admin" },
  { value: "staff_member", label: "Staff Member" },
];

export const roleLabel = (role) => {
  const normalized = normalizeRole(role);
  return (
    {
      student: "Student",
      admin: "Admin",
      staff_member: "Staff Member",
    }[normalized] || "User"
  );
};

export const normalizeRole = (role) => {
  if (!role) return "";
  return role.toString().trim().toLowerCase().replace(/\s+/g, "_");
};

export const profilePathByRole = (role) => {
  switch (normalizeRole(role)) {
    case "student":
      return "/student/profile";
    case "staff_member":
      return "/staff/profile";
    case "admin":
      return "/admin/profile";
    default:
      return "/login";
  }
};

export const homePathByRole = (role) => {
  switch (normalizeRole(role)) {
    case "student":
      return "/student/dashboard";
    case "staff_member":
      return "/staff/profile";
    case "admin":
      return "/admin/users";
    default:
      return "/login";
  }
};

export const isStudentLikeRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === "student" || normalized === "staff_member";
};

export const isPrivilegedRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === "admin";
};

export const formatEnumText = (value) => {
  if (!value) return "-";
  return value
    .toString()
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
};
