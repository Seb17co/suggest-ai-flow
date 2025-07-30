-- First, ensure we have a user with the correct email
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Check if user already exists
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'sebastian@luxkids.dk';
    
    -- If user doesn't exist, create it
    IF user_uuid IS NULL THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            aud,
            role
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'sebastian@luxkids.dk',
            crypt('123456', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"full_name": "Sebastian"}',
            'authenticated',
            'authenticated'
        ) RETURNING id INTO user_uuid;
    END IF;
    
    -- Update or insert profile with admin role
    INSERT INTO public.profiles (user_id, full_name, role)
    VALUES (user_uuid, 'Sebastian', 'admin')
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin',
        full_name = 'Sebastian',
        updated_at = now();
END $$;