--
-- PostgreSQL database dump
--

\restrict A0o1vV3ejeHld38xgaOJZx5p32lXBgqU8qVarWRa617leqkCU0223ITgVjgddBm

-- Dumped from database version 15.16
-- Dumped by pg_dump version 15.16

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

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: golfins_user
--

CREATE TYPE public.userrole AS ENUM (
    'CUSTOMER',
    'ADMIN',
    'ADJUSTER',
    'UNDERWRITER',
    'PARTNER'
);


ALTER TYPE public.userrole OWNER TO golfins_user;

--
-- Name: userstatus; Type: TYPE; Schema: public; Owner: golfins_user
--

CREATE TYPE public.userstatus AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public.userstatus OWNER TO golfins_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: claims; Type: TABLE; Schema: public; Owner: golfins_user
--

CREATE TABLE public.claims (
    id character varying(36) NOT NULL,
    claim_number character varying(50),
    policy_id character varying(36),
    user_id character varying(36),
    status character varying(20),
    amount_requested numeric(10,2),
    description text,
    incident_date character varying(20),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    claim_type character varying(30) DEFAULT 'regular'::character varying,
    metadata json
);


ALTER TABLE public.claims OWNER TO golfins_user;

--
-- Name: coverage_options; Type: TABLE; Schema: public; Owner: golfins_user
--

CREATE TABLE public.coverage_options (
    id character varying(36) NOT NULL,
    product_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    description text,
    base_premium numeric(15,2),
    coverage_limit numeric(15,2),
    sub_limit numeric(15,2),
    sub_limit_label character varying(100),
    deductible numeric(15,2),
    territorial_limit character varying(255),
    sort_order integer,
    active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.coverage_options OWNER TO golfins_user;

--
-- Name: equipment; Type: TABLE; Schema: public; Owner: golfins_user
--

CREATE TABLE public.equipment (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    policy_id character varying(36),
    name character varying(255) NOT NULL,
    category character varying(50),
    brand character varying(100),
    model_name character varying(100),
    serial_number character varying(100),
    purchase_date character varying(20),
    estimated_value numeric(10,2),
    status character varying(20),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.equipment OWNER TO golfins_user;

--
-- Name: plan_coverages; Type: TABLE; Schema: public; Owner: golfins_user
--

CREATE TABLE public.plan_coverages (
    id character varying(36) NOT NULL,
    plan_id character varying(36) NOT NULL,
    coverage_option_id character varying(36) NOT NULL,
    coverage_limit numeric(15,2) NOT NULL,
    sub_limit numeric(15,2),
    created_at timestamp without time zone
);


ALTER TABLE public.plan_coverages OWNER TO golfins_user;

--
-- Name: policies; Type: TABLE; Schema: public; Owner: golfins_user
--

CREATE TABLE public.policies (
    id character varying(36) NOT NULL,
    policy_number character varying(50),
    user_id character varying(36),
    product_id character varying(36),
    status character varying(50),
    premium_amount numeric(10,2),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    expiry_date timestamp without time zone
);


ALTER TABLE public.policies OWNER TO golfins_user;

--
-- Name: premium_plans; Type: TABLE; Schema: public; Owner: golfins_user
--

CREATE TABLE public.premium_plans (
    id character varying(36) NOT NULL,
    product_id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20),
    net_premium numeric(15,2) NOT NULL,
    total_premium numeric(15,2) NOT NULL,
    sort_order integer,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.premium_plans OWNER TO golfins_user;

--
-- Name: premium_rules; Type: TABLE; Schema: public; Owner: golfins_user
--

CREATE TABLE public.premium_rules (
    id character varying(36) NOT NULL,
    product_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    rule_type character varying(50) NOT NULL,
    min_value numeric(10,2),
    max_value numeric(10,2),
    adjustment_type character varying(20) NOT NULL,
    adjustment_value numeric(10,4) NOT NULL,
    operator character varying(10),
    priority integer,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.premium_rules OWNER TO golfins_user;

--
-- Name: products; Type: TABLE; Schema: public; Owner: golfins_user
--

CREATE TABLE public.products (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    description text,
    product_type character varying(50) NOT NULL,
    currency character varying(10),
    vat_rate numeric(5,4),
    insurance_period_days integer,
    status character varying(20),
    version integer,
    effective_date timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.products OWNER TO golfins_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: golfins_user
--

CREATE TABLE public.users (
    id character varying(36) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    date_of_birth timestamp without time zone,
    role public.userrole NOT NULL,
    status public.userstatus NOT NULL,
    email_verified boolean,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    deleted_at timestamp without time zone,
    nationality character varying(100),
    gender character varying(20),
    id_passport character varying(100),
    address character varying(500),
    company_name character varying(255),
    user_metadata jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.users OWNER TO golfins_user;

--
-- Data for Name: claims; Type: TABLE DATA; Schema: public; Owner: golfins_user
--

COPY public.claims (id, claim_number, policy_id, user_id, status, amount_requested, description, incident_date, created_at, updated_at, claim_type, metadata) FROM stdin;
\.


--
-- Data for Name: coverage_options; Type: TABLE DATA; Schema: public; Owner: golfins_user
--

COPY public.coverage_options (id, product_id, name, code, description, base_premium, coverage_limit, sub_limit, sub_limit_label, deductible, territorial_limit, sort_order, active, created_at, updated_at) FROM stdin;
b17a9a69-009e-4ee9-bb8d-d24852324a13	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	Liability to public	LIABILITY	\N	0.00	\N	\N	\N	0.00	Worldwide excluding USA & Canada	1	t	2026-04-04 11:06:39.047406	2026-04-04 11:06:39.047408
abeed83b-b573-4a9b-af69-d17576ce8c23	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	Golfing equipment	EQUIPMENT	\N	0.00	\N	\N	Max per golf club	0.00	ASEAN, China, Taiwan, Japan, Korea	2	t	2026-04-04 11:06:39.047409	2026-04-04 11:06:39.04741
d52b3a51-009d-40a9-a07b-070e9f46a925	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	Personal Effects	PERSONAL_FX	\N	0.00	\N	\N	\N	0.00	ASEAN, China, Taiwan, Japan, Korea	3	t	2026-04-04 11:06:39.047411	2026-04-04 11:06:39.047411
a72cbb2d-d658-4cde-bc81-5b427e2085d0	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	Personal accident	ACCIDENT	\N	0.00	\N	\N	\N	0.00	Worldwide excluding USA & Canada	4	t	2026-04-04 11:06:39.047412	2026-04-04 11:06:39.047412
39d97a3e-9be7-4b10-b483-682271f18d74	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	Hole in one & Albatross	HOLE_IN_ONE	\N	0.00	\N	\N	\N	0.00	ASEAN, China, Taiwan, Japan, Korea	5	t	2026-04-04 11:06:39.047413	2026-04-04 11:06:39.047413
c47e0895-4383-40cd-91c1-c6271244796e	abb5e0b8-01a6-4bdf-9c09-4f3f08102dc1	Liability to public	LIABILITY	\N	0.00	\N	\N	\N	0.00	Worldwide excluding USA & Canada	1	t	2026-04-04 11:06:39.047414	2026-04-04 11:06:39.047414
ad822208-286d-4290-8f89-0b0b141330f5	c8bcd483-e669-4540-a240-467af4854903	Liability to public	LIABILITY	\N	0.00	\N	\N	\N	0.00	Worldwide excluding USA & Canada	1	t	2026-04-04 11:06:39.047415	2026-04-04 11:06:39.047415
65b5d08e-6805-4d90-b8ee-0acb108cc24a	abb5e0b8-01a6-4bdf-9c09-4f3f08102dc1	Golfing equipment	EQUIPMENT	\N	0.00	\N	\N	Max per golf club	0.00	ASEAN, China, Taiwan, Japan, Korea	2	t	2026-04-04 11:06:39.047416	2026-04-04 11:06:39.047417
19ad2c9e-9ff4-4517-9bf2-c7b424632976	c8bcd483-e669-4540-a240-467af4854903	Golfing equipment	EQUIPMENT	\N	0.00	\N	\N	Max per golf club	0.00	ASEAN, China, Taiwan, Japan, Korea	2	t	2026-04-04 11:06:39.047417	2026-04-04 11:06:39.047418
ff9d4e9c-76f8-43de-acaf-56fc57d3db4b	abb5e0b8-01a6-4bdf-9c09-4f3f08102dc1	Personal Effects	PERSONAL_FX	\N	0.00	\N	\N	\N	0.00	ASEAN, China, Taiwan, Japan, Korea	3	t	2026-04-04 11:06:39.047419	2026-04-04 11:06:39.047419
b937279e-dc3d-4139-b60f-578aedd3c9c9	c8bcd483-e669-4540-a240-467af4854903	Personal Effects	PERSONAL_FX	\N	0.00	\N	\N	\N	0.00	ASEAN, China, Taiwan, Japan, Korea	3	t	2026-04-04 11:06:39.04742	2026-04-04 11:06:39.04742
5ba93c39-fc97-4ef9-92e7-6488e06444d3	abb5e0b8-01a6-4bdf-9c09-4f3f08102dc1	Personal accident	ACCIDENT	\N	0.00	\N	\N	\N	0.00	Worldwide excluding USA & Canada	4	t	2026-04-04 11:06:39.047421	2026-04-04 11:06:39.047421
796c5b1a-45c1-4de2-9685-16c3e59208ce	c8bcd483-e669-4540-a240-467af4854903	Personal accident	ACCIDENT	\N	0.00	\N	\N	\N	0.00	Worldwide excluding USA & Canada	4	t	2026-04-04 11:06:39.047422	2026-04-04 11:06:39.047422
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: golfins_user
--

COPY public.equipment (id, user_id, policy_id, name, category, brand, model_name, serial_number, purchase_date, estimated_value, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: plan_coverages; Type: TABLE DATA; Schema: public; Owner: golfins_user
--

COPY public.plan_coverages (id, plan_id, coverage_option_id, coverage_limit, sub_limit, created_at) FROM stdin;
9db26df9-55cc-4fb6-be34-10f9bbce8cdb	96c3ffe6-3b57-418c-aa80-affd8f8bc945	b17a9a69-009e-4ee9-bb8d-d24852324a13	1000000000.00	\N	2026-04-04 11:06:39.053757
895834d6-00e9-4476-9b72-b3da66993ca0	96c3ffe6-3b57-418c-aa80-affd8f8bc945	abeed83b-b573-4a9b-af69-d17576ce8c23	20000000.00	4000000.00	2026-04-04 11:06:39.053759
45d57810-db6c-4778-b90b-2b57b4da2ffb	96c3ffe6-3b57-418c-aa80-affd8f8bc945	d52b3a51-009d-40a9-a07b-070e9f46a925	4000000.00	\N	2026-04-04 11:06:39.05376
166ea933-d105-46a3-b5cf-d0c739b78347	96c3ffe6-3b57-418c-aa80-affd8f8bc945	a72cbb2d-d658-4cde-bc81-5b427e2085d0	100000000.00	\N	2026-04-04 11:06:39.05376
98a4251c-ba0c-4fce-b8a9-bc0633e15c0c	96c3ffe6-3b57-418c-aa80-affd8f8bc945	39d97a3e-9be7-4b10-b483-682271f18d74	10000000.00	\N	2026-04-04 11:06:39.053761
c6fe91f2-9e7e-4aeb-a02a-acee0e264d06	718d651b-0350-445b-aaf0-4274b55a8d5b	b17a9a69-009e-4ee9-bb8d-d24852324a13	2000000000.00	\N	2026-04-04 11:06:39.053761
4c45e3a3-83bb-4105-b326-a9939467f618	718d651b-0350-445b-aaf0-4274b55a8d5b	abeed83b-b573-4a9b-af69-d17576ce8c23	30000000.00	4000000.00	2026-04-04 11:06:39.053762
c897b081-f8c7-4fac-a226-cd38af971bfe	718d651b-0350-445b-aaf0-4274b55a8d5b	d52b3a51-009d-40a9-a07b-070e9f46a925	8000000.00	\N	2026-04-04 11:06:39.053762
75a496b6-4c82-4155-a2f5-21a998fcc48b	718d651b-0350-445b-aaf0-4274b55a8d5b	a72cbb2d-d658-4cde-bc81-5b427e2085d0	200000000.00	\N	2026-04-04 11:06:39.053762
e5fc7fca-8bcd-485a-9256-8620cdf5cb33	718d651b-0350-445b-aaf0-4274b55a8d5b	39d97a3e-9be7-4b10-b483-682271f18d74	20000000.00	\N	2026-04-04 11:06:39.053763
b12b1ad2-da20-4cdb-b06e-f059e053919b	23e00ea9-8b41-41db-b250-ec903569b60e	b17a9a69-009e-4ee9-bb8d-d24852324a13	3000000000.00	\N	2026-04-04 11:06:39.053763
a59b67cd-35d4-499b-8c36-c7e35198c51d	23e00ea9-8b41-41db-b250-ec903569b60e	abeed83b-b573-4a9b-af69-d17576ce8c23	50000000.00	4000000.00	2026-04-04 11:06:39.053764
3a628e63-1c06-49d2-85c8-ed0af6f95ae5	23e00ea9-8b41-41db-b250-ec903569b60e	d52b3a51-009d-40a9-a07b-070e9f46a925	10000000.00	\N	2026-04-04 11:06:39.053764
126c81bc-7c4e-44c4-adb9-96ea4dc4b955	23e00ea9-8b41-41db-b250-ec903569b60e	a72cbb2d-d658-4cde-bc81-5b427e2085d0	200000000.00	\N	2026-04-04 11:06:39.053765
3064bc3e-17a9-4d6e-bc6a-52850a6951bd	23e00ea9-8b41-41db-b250-ec903569b60e	39d97a3e-9be7-4b10-b483-682271f18d74	30000000.00	\N	2026-04-04 11:06:39.053765
615b2fb6-a29f-4b75-a316-ab375012deb4	adb6af0d-57ac-4d9d-9189-e04b599d38f8	c47e0895-4383-40cd-91c1-c6271244796e	20000000.00	\N	2026-04-04 11:06:39.053766
0a703e3a-3da2-44d6-9187-74021565bc1f	adb6af0d-57ac-4d9d-9189-e04b599d38f8	65b5d08e-6805-4d90-b8ee-0acb108cc24a	5000000.00	2000000.00	2026-04-04 11:06:39.053766
c1f60193-f86b-4271-97cc-a6ebc4040ae7	adb6af0d-57ac-4d9d-9189-e04b599d38f8	ff9d4e9c-76f8-43de-acaf-56fc57d3db4b	4000000.00	\N	2026-04-04 11:06:39.053767
9c9e8b92-8941-42d8-b7bd-df44ad892dbb	adb6af0d-57ac-4d9d-9189-e04b599d38f8	5ba93c39-fc97-4ef9-92e7-6488e06444d3	50000000.00	\N	2026-04-04 11:06:39.053767
307bf3db-0c23-40ba-bc4a-628768795e01	0a439c7b-489e-4271-92c1-2d1df3f80758	ad822208-286d-4290-8f89-0b0b141330f5	20000000.00	\N	2026-04-04 11:06:39.053767
951c5789-7b67-41da-8436-b0d61a8f38db	0a439c7b-489e-4271-92c1-2d1df3f80758	19ad2c9e-9ff4-4517-9bf2-c7b424632976	5000000.00	2000000.00	2026-04-04 11:06:39.053768
2302bf79-f4fe-4595-8b4c-1e48f2917e86	0a439c7b-489e-4271-92c1-2d1df3f80758	b937279e-dc3d-4139-b60f-578aedd3c9c9	4000000.00	\N	2026-04-04 11:06:39.053768
2d40637f-2e45-4da9-ad0c-3bca8d2ae5b9	0a439c7b-489e-4271-92c1-2d1df3f80758	796c5b1a-45c1-4de2-9685-16c3e59208ce	50000000.00	\N	2026-04-04 11:06:39.053769
\.


--
-- Data for Name: policies; Type: TABLE DATA; Schema: public; Owner: golfins_user
--

COPY public.policies (id, policy_number, user_id, product_id, status, premium_amount, created_at, updated_at, expiry_date) FROM stdin;
c4b03f9e-d542-4ac1-b003-273f9ba78017	POL-0D77A1	fc81fbd8-3da9-4bd5-aee5-9bf7349f2e12	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	cancelled	2090000.00	2026-04-04 12:47:42.253192	2026-04-04 14:35:07.45355	\N
fabdfa4c-738f-4361-bd62-f3a57683604d	POL-D58809	fc81fbd8-3da9-4bd5-aee5-9bf7349f2e12	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	cancelled	2090000.00	2026-04-04 12:39:57.016778	2026-04-04 14:35:08.788862	\N
43bc73d1-8959-474a-b28b-76d9fc375d30	POL-10A179	fc81fbd8-3da9-4bd5-aee5-9bf7349f2e12	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	active	3080000.00	2026-04-04 14:52:51.1116	2026-04-04 15:07:00.697252	\N
1c5cc36b-4454-4271-9668-bfe465bc4dea	POL-16580D	fc81fbd8-3da9-4bd5-aee5-9bf7349f2e12	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	active	2090000.00	2026-04-04 14:47:54.985954	2026-04-04 15:11:26.354428	\N
a0bf941d-ebd3-4d92-b3ab-438e39fd7eba	POL-AA2F1E	fc81fbd8-3da9-4bd5-aee5-9bf7349f2e12	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	active	3080000.00	2026-04-04 14:41:40.177597	2026-04-04 15:32:48.754865	2027-04-04 15:32:48.754804
95b84c5b-1b4f-4162-a7d9-bc5269da804e	POL-FD3BEB	fc81fbd8-3da9-4bd5-aee5-9bf7349f2e12	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	active	1430000.00	2026-04-04 14:35:33.197256	2026-04-04 15:39:39.709548	2027-04-04 15:39:39.709473
fc7ea2d0-62bb-4d4c-ace5-2c11c84b600d	POL-22971E	fc81fbd8-3da9-4bd5-aee5-9bf7349f2e12	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	active	3080000.00	2026-04-04 15:43:16.682402	2026-04-04 15:44:58.906082	2027-04-04 15:44:58.906042
6d32e6cf-7e96-476e-8b2c-3361d24adf3e	POL-993C56	fc81fbd8-3da9-4bd5-aee5-9bf7349f2e12	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	active	2090000.00	2026-04-04 15:46:29.085001	2026-04-04 15:47:02.011126	2027-04-04 15:47:02.011074
018b9449-a7a3-48e1-9197-61b9d93258ac	POL-3DCEC2	fc81fbd8-3da9-4bd5-aee5-9bf7349f2e12	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	active	3080000.00	2026-04-04 15:53:27.772782	2026-04-04 15:54:01.609593	2027-04-04 15:54:01.609517
1c537fd4-6f4a-4d47-a8fc-5620e7f5ceca	POL-878515	c81d6460-d3f2-40b3-94e4-9984eb686653	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	active	1430000.00	2026-04-04 16:20:38.110035	2026-04-04 16:51:56.229717	2027-04-04 16:51:56.229664
\.


--
-- Data for Name: premium_plans; Type: TABLE DATA; Schema: public; Owner: golfins_user
--

COPY public.premium_plans (id, product_id, name, code, net_premium, total_premium, sort_order, is_active, created_at, updated_at) FROM stdin;
96c3ffe6-3b57-418c-aa80-affd8f8bc945	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	Plan A	A	1300000.00	1430000.00	1	t	2026-04-04 11:06:39.041227	2026-04-04 11:06:39.041229
718d651b-0350-445b-aaf0-4274b55a8d5b	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	Plan B	B	1900000.00	2090000.00	2	t	2026-04-04 11:06:39.04123	2026-04-04 11:06:39.041231
23e00ea9-8b41-41db-b250-ec903569b60e	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	Plan C	C	2800000.00	3080000.00	3	t	2026-04-04 11:06:39.041231	2026-04-04 11:06:39.041232
0a439c7b-489e-4271-92c1-2d1df3f80758	c8bcd483-e669-4540-a240-467af4854903	Spot 2-Day	2DAY	177273.00	195000.00	1	t	2026-04-04 11:06:39.041233	2026-04-04 11:06:39.041233
adb6af0d-57ac-4d9d-9189-e04b599d38f8	abb5e0b8-01a6-4bdf-9c09-4f3f08102dc1	Spot 1-Day	1DAY	90910.00	100000.00	1	t	2026-04-04 11:06:39.041232	2026-04-04 14:18:39.484784
\.


--
-- Data for Name: premium_rules; Type: TABLE DATA; Schema: public; Owner: golfins_user
--

COPY public.premium_rules (id, product_id, name, description, rule_type, min_value, max_value, adjustment_type, adjustment_value, operator, priority, is_active, created_at, updated_at) FROM stdin;
2f5dfc17-7e18-41c7-a2e6-358b1deec4bb	25cd0aca-d10b-4248-ad64-ff9cc9c173b2	Junior Discount	\N	age	0.00	18.00	percentage	-20.0000	between	1	t	2026-04-04 11:06:39.061078	2026-04-04 11:06:39.06108
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: golfins_user
--

COPY public.products (id, name, code, description, product_type, currency, vat_rate, insurance_period_days, status, version, effective_date, created_at, updated_at) FROM stdin;
25cd0aca-d10b-4248-ad64-ff9cc9c173b2	Annual Program	ANNUAL	\N	annual	VND	0.1000	365	active	1	2026-04-04 11:06:38.987042	2026-04-04 11:06:39.035275	2026-04-04 11:06:39.035277
c8bcd483-e669-4540-a240-467af4854903	Spot 2-Day	SPOT_2DAY	\N	spot_2day	VND	0.1000	2	active	1	2026-04-04 11:06:38.987042	2026-04-04 11:06:39.035282	2026-04-04 11:06:39.035282
abb5e0b8-01a6-4bdf-9c09-4f3f08102dc1	Spot 1-Day	SPOT_1DAY		spot_1day	VND	0.1000	1	active	1	2026-04-04 11:06:38.987042	2026-04-04 11:06:39.03528	2026-04-04 14:18:39.413388
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: golfins_user
--

COPY public.users (id, email, phone, password_hash, first_name, last_name, date_of_birth, role, status, email_verified, created_at, updated_at, deleted_at, nationality, gender, id_passport, address, company_name, user_metadata) FROM stdin;
53d454a5-436f-47e6-9c5b-2270c2ccb7ec	Jhon@golfins.com	+84913210989	$2b$12$VnCLaNznorsGGsOkX/gA1Oi68XCkMwPTDEFj6.C2P8Vi1N1cE0Oxm	John	Doe	\N	CUSTOMER	ACTIVE	t	2026-04-03 16:32:17.408637	2026-04-03 16:32:17.408639	\N	\N	\N	\N	\N	\N	{}
fc81fbd8-3da9-4bd5-aee5-9bf7349f2e12	test@golfins.com	+84913210989	$2b$12$HHdJ8m7VOXPWMY1SQs.QlOqcpTyqvwTzuLa1LvAoc3xxsiQXUJ0J6	Nguyen	Test	\N	CUSTOMER	ACTIVE	f	2026-03-31 13:09:53.879062	2026-04-04 13:09:23.491677	\N	Vietnam	Male		qqqwerwqerqw	4543543534	{}
c81d6460-d3f2-40b3-94e4-9984eb686653	admin@golfins.com	+84913210989	$2b$12$.9b6QSqnRjTBT7y559UAZO.ItHBvaS5u5jZby.qaRpqXNrzh/3m5W	Admin	Golfins	\N	ADMIN	ACTIVE	f	2026-04-01 14:31:05.689649	2026-04-04 16:20:37.948789	\N	Vietnam	Male				{}
\.


--
-- Name: claims claims_claim_number_key; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_claim_number_key UNIQUE (claim_number);


--
-- Name: claims claims_pkey; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_pkey PRIMARY KEY (id);


--
-- Name: coverage_options coverage_options_pkey; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.coverage_options
    ADD CONSTRAINT coverage_options_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: plan_coverages plan_coverages_pkey; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.plan_coverages
    ADD CONSTRAINT plan_coverages_pkey PRIMARY KEY (id);


--
-- Name: policies policies_pkey; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);


--
-- Name: policies policies_policy_number_key; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_policy_number_key UNIQUE (policy_number);


--
-- Name: premium_plans premium_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.premium_plans
    ADD CONSTRAINT premium_plans_pkey PRIMARY KEY (id);


--
-- Name: premium_rules premium_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.premium_rules
    ADD CONSTRAINT premium_rules_pkey PRIMARY KEY (id);


--
-- Name: products products_code_key; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_code_key UNIQUE (code);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: golfins_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: coverage_options coverage_options_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.coverage_options
    ADD CONSTRAINT coverage_options_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: plan_coverages plan_coverages_coverage_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.plan_coverages
    ADD CONSTRAINT plan_coverages_coverage_option_id_fkey FOREIGN KEY (coverage_option_id) REFERENCES public.coverage_options(id);


--
-- Name: plan_coverages plan_coverages_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.plan_coverages
    ADD CONSTRAINT plan_coverages_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.premium_plans(id);


--
-- Name: premium_plans premium_plans_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.premium_plans
    ADD CONSTRAINT premium_plans_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: premium_rules premium_rules_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: golfins_user
--

ALTER TABLE ONLY public.premium_rules
    ADD CONSTRAINT premium_rules_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- PostgreSQL database dump complete
--

\unrestrict A0o1vV3ejeHld38xgaOJZx5p32lXBgqU8qVarWRa617leqkCU0223ITgVjgddBm

