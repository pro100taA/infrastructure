({
    role_hierarchy: {
        'root_admin': [
            'all_invitation',
            'all_firm',
            'all_user'
        ],


        /************************************************ Permissions ************************************************/

        'all_invitation': [
            'firm_invitation',
            'root_invitation'
        ],

        'firm_invitation': [
            'firm_member_invitation',
            'appoint_an_assistant',

            'index_firm_client_invitation',
            'create_firm_client_invitation',
            'delete_firm_client_invitation',

            'index_firm_member_invitation',
            'create_firm_member_invitation',
            'delete_firm_member_invitation',
        ]
    }
});
