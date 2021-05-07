const roleInit = (roleHierarchy) => {
    const rolePermissions = {};
    const getPermissions = (permission) => (roleHierarchy[permission] ? getRole(permission) : permission);

    function getRole(role) {
        if (rolePermissions[role]) {
            return rolePermissions[role];
        }

        rolePermissions[role] = [...new Set([role, ...roleHierarchy[role].flatMap((i) => getPermissions(i))])];
        return rolePermissions[role];
    }

    for (const item in roleHierarchy) {
        getRole(item);
    }

    return rolePermissions;
};

module.exports = (config) => {
    const { role_hierarchy: roleHierarchy } = config;
    const rolePermissions = roleInit(roleHierarchy);

    return (role) => {
        const myPermissions = rolePermissions[role] || [];

        return {
            isGranted: (attributes) => myPermissions.includes(attributes),
            getMyPermission: () => myPermissions
        };
    };
};
