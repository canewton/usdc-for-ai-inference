

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE 
    display_name TEXT;
    new_profile_id UUID;
BEGIN
    -- Get display name from raw_user_meta_data if available, otherwise use email
    display_name := COALESCE(
        (NEW.raw_user_meta_data->>'full_name'),
        split_part(NEW.email, '@', 1),
        NEW.email
    );
    
    BEGIN
        INSERT INTO public.profiles (auth_user_id, name)
        VALUES (NEW.id, display_name)
        RETURNING id INTO new_profile_id;

        RAISE LOG 'Created profile % for auth user %', new_profile_id, NEW.id;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
    END;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."3d_generations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "prompt" "text" DEFAULT ''::"text",
    "url" "text" DEFAULT ''::"text",
    "provider" "text" DEFAULT ''::"text",
    "user_id" "uuid",
    "mode" "text",
    "image_url" "text",
    "circle_transaction_id" "uuid",
    "status" "text",
    "title" "text",
    "task_id" "text"
);


ALTER TABLE "public"."3d_generations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_name" "text" NOT NULL,
    "ai_model" "text" NOT NULL,
    "circle_transaction_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "circle_wallet_id" "text"
);


ALTER TABLE "public"."ai_projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_generations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "user_text" "text" DEFAULT ''::"text" NOT NULL,
    "ai_text" "text" DEFAULT ''::"text",
    "chat_id" "uuid",
    "provider" "text",
    "prompt_tokens" smallint,
    "completion_tokens" smallint
);


ALTER TABLE "public"."chat_generations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "title" "text",
    "chat_type" "text"
);


ALTER TABLE "public"."chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."image_generations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "prompt" "text" DEFAULT ''::"text",
    "url" "text" DEFAULT ''::"text",
    "provider" "text" DEFAULT ''::"text",
    "user_id" "uuid",
    "circle_transaction_id" "uuid",
    "chat_id" "uuid"
);


ALTER TABLE "public"."image_generations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "name" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "is_active" boolean DEFAULT true,
    "email" character varying(320),
    "full_name" character varying(255),
    "is_admin" boolean DEFAULT false NOT NULL,
    "last_active" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'RLS disabled and policies dropped in migration.';



COMMENT ON COLUMN "public"."profiles"."id" IS 'Primary key UUID for the profile';



COMMENT ON COLUMN "public"."profiles"."auth_user_id" IS 'Foreign key reference to auth.users table';



CREATE TABLE IF NOT EXISTS "public"."todos" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "is_complete" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."todos" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."todos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."todos_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."todos_id_seq" OWNED BY "public"."todos"."id";



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "profile_id" "uuid",
    "circle_transaction_id" character varying,
    "transaction_type" character varying,
    "amount" numeric(20,8) DEFAULT '0'::numeric NOT NULL,
    "currency" character varying NOT NULL,
    "status" character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "description" "text",
    "circle_contract_address" character varying,
    "balance" numeric,
    "risk_score" "text" DEFAULT 'N/A'::"text",
    "risk_categories" "text"[] DEFAULT '{None}'::"text"[]
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."transactions" IS 'RLS disabled and policies dropped in migration.';



CREATE TABLE IF NOT EXISTS "public"."video_generations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "prompt" "text" NOT NULL,
    "model_name" "text" NOT NULL,
    "seed" numeric NOT NULL,
    "prompt_image_path" "text" NOT NULL,
    "video_url" "text",
    "task_id" "text" NOT NULL,
    "processing_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text"
);


ALTER TABLE "public"."video_generations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid",
    "circle_wallet_id" character varying NOT NULL,
    "wallet_type" character varying NOT NULL,
    "balance" numeric(20,8) DEFAULT 0 NOT NULL,
    "currency" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "is_active" boolean DEFAULT true,
    "wallet_set_id" "uuid",
    "wallet_address" character varying(255),
    "account_type" character varying(50),
    "blockchain" character varying(50)
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


COMMENT ON TABLE "public"."wallets" IS 'RLS disabled and policies dropped in migration.';



COMMENT ON COLUMN "public"."wallets"."wallet_set_id" IS 'Reference to the wallet set';



COMMENT ON COLUMN "public"."wallets"."wallet_address" IS 'Blockchain wallet address';



COMMENT ON COLUMN "public"."wallets"."account_type" IS 'Type of blockchain account';



COMMENT ON COLUMN "public"."wallets"."blockchain" IS 'Name of the blockchain network';



ALTER TABLE ONLY "public"."todos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."todos_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."3d_generations"
    ADD CONSTRAINT "3d_generations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_projects"
    ADD CONSTRAINT "ai_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_generations"
    ADD CONSTRAINT "chat_generations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."image_generations"
    ADD CONSTRAINT "image_generations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."video_generations"
    ADD CONSTRAINT "video_generations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_transactions_profile_id" ON "public"."transactions" USING "btree" ("profile_id");



CREATE INDEX "idx_transactions_wallet_id" ON "public"."transactions" USING "btree" ("wallet_id");



CREATE INDEX "idx_wallets_address" ON "public"."wallets" USING "btree" ("wallet_address");



CREATE INDEX "idx_wallets_profile_id" ON "public"."wallets" USING "btree" ("profile_id");



CREATE INDEX "video_generations_created_at_idx" ON "public"."video_generations" USING "btree" ("created_at");



CREATE INDEX "video_generations_task_id_idx" ON "public"."video_generations" USING "btree" ("task_id");



CREATE INDEX "video_generations_user_id_idx" ON "public"."video_generations" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_wallets_updated_at" BEFORE UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."3d_generations"
    ADD CONSTRAINT "3d_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."chat_generations"
    ADD CONSTRAINT "chat_generations_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_generations"
    ADD CONSTRAINT "chat_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_generations"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."image_generations"
    ADD CONSTRAINT "image_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "profiles_auth_user_id_fkey" ON "public"."profiles" IS 'Foreign key reference to auth.users table with CASCADE DELETE enabled';



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."video_generations"
    ADD CONSTRAINT "video_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public inserts" ON "public"."chat_generations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public inserts" ON "public"."image_generations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable delete for any user" ON "public"."image_generations" FOR DELETE USING (true);



CREATE POLICY "Enable delete for users based on user_id" ON "public"."3d_generations" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."3d_generations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for users based on user_id" ON "public"."chat_generations" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."image_generations" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable read access for all users" ON "public"."3d_generations" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."chat_generations" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."image_generations" FOR SELECT USING (true);



CREATE POLICY "Users can insert own video generations" ON "public"."video_generations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only access their own todos" ON "public"."todos" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own video generations" ON "public"."video_generations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own video generations" ON "public"."video_generations" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."image_generations" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ai_projects";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."transactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."wallets";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."3d_generations" TO "anon";
GRANT ALL ON TABLE "public"."3d_generations" TO "authenticated";
GRANT ALL ON TABLE "public"."3d_generations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_projects" TO "anon";
GRANT ALL ON TABLE "public"."ai_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_projects" TO "service_role";



GRANT ALL ON TABLE "public"."chat_generations" TO "anon";
GRANT ALL ON TABLE "public"."chat_generations" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_generations" TO "service_role";



GRANT ALL ON TABLE "public"."chats" TO "anon";
GRANT ALL ON TABLE "public"."chats" TO "authenticated";
GRANT ALL ON TABLE "public"."chats" TO "service_role";



GRANT ALL ON TABLE "public"."image_generations" TO "anon";
GRANT ALL ON TABLE "public"."image_generations" TO "authenticated";
GRANT ALL ON TABLE "public"."image_generations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."todos" TO "anon";
GRANT ALL ON TABLE "public"."todos" TO "authenticated";
GRANT ALL ON TABLE "public"."todos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."todos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."todos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."todos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."video_generations" TO "anon";
GRANT ALL ON TABLE "public"."video_generations" TO "authenticated";
GRANT ALL ON TABLE "public"."video_generations" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
