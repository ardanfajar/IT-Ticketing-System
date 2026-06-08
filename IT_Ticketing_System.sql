--
-- PostgreSQL database dump
--

\restrict CXvve3vNTCOLHTwKO8CpagS9vQWjXA5TcUCcalApVodd79VihQftv5LRHc4BamO

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-06-08 10:03:58

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 856 (class 1247 OID 24834)
-- Name: ticket_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ticket_status_enum AS ENUM (
    'belum_dikerjakan',
    'diproses',
    'selesai',
    'ditolak'
);


ALTER TYPE public.ticket_status_enum OWNER TO postgres;

--
-- TOC entry 223 (class 1255 OID 24843)
-- Name: notify_ticket_changes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_ticket_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM pg_notify('ticket_update', json_build_object(
        'operation', TG_OP,
        'ticket', row_to_json(NEW)
    )::text);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_ticket_changes() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 24844)
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    ticket_number character varying(30) NOT NULL,
    source character varying(50) NOT NULL,
    message text NOT NULL,
    status character varying(30) DEFAULT 'belum_dikerjakan'::character varying NOT NULL,
    completed_by character varying(100),
    completed_at character varying(30),
    created_at character varying(30) NOT NULL,
    updated_at character varying(30) NOT NULL,
    CONSTRAINT tickets_status_check CHECK (((status)::text = ANY (ARRAY[('belum_dikerjakan'::character varying)::text, ('diproses'::character varying)::text, ('selesai'::character varying)::text, ('ditolak'::character varying)::text])))
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24858)
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_id_seq OWNER TO postgres;

--
-- TOC entry 5037 (class 0 OID 0)
-- Dependencies: 220
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- TOC entry 221 (class 1259 OID 24859)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'admin'::character varying NOT NULL,
    avatar text,
    completed_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24872)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5038 (class 0 OID 0)
-- Dependencies: 222
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4865 (class 2604 OID 24873)
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- TOC entry 4867 (class 2604 OID 24874)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5028 (class 0 OID 24844)
-- Dependencies: 219
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, ticket_number, source, message, status, completed_by, completed_at, created_at, updated_at) FROM stdin;
1	TCK-2026-001	Bot Telegram	Koneksi internet di Ruang Server Lantai 2 terputus secara mendadak.	selesai	Citra Lestari	2026-06-07 14:30	2026-06-07 10:00	2026-06-07 14:30
2	TCK-2026-002	Email Support	Aplikasi CRM internal melambat dan sering mengalami timeout saat query.	diproses	\N	\N	2026-06-07 11:15	2026-06-07 11:30
3	TCK-2026-003	Web Portal	Gagal melakukan cetak slip gaji, printer IP 192.168.1.150 offline.	belum_dikerjakan	\N	\N	2026-06-07 13:02	2026-06-07 13:02
4	TCK-2026-004	Bot Telegram	Pemberitahuan: Kapasitas storage server backup tersisa 5%.	diproses	\N	\N	2026-06-07 13:45	2026-06-07 14:00
5	TCK-2026-005	Web Portal	Permintaan reset password akun email marketing perusahaan.	selesai	Andri Hermawan	2026-06-07 15:10	2026-06-07 14:20	2026-06-07 15:10
6	TCK-2026-006	API System	Gagal singkronisasi data transaksi dari POS cabang Bandung.	belum_dikerjakan	\N	\N	2026-06-08 00:30	2026-06-08 00:30
7	TCK-2026-007	Email Support	Instalasi lisensi Microsoft Office 365 baru untuk staff Keuangan.	ditolak	Budi Santoso	2026-06-07 16:00	2026-06-07 15:00	2026-06-07 16:00
8	TCK-2026-108	API System	Test Postgres Notification Trigger	diproses	\N	\N	2026-06-08 02:29	2026-06-08 02:37
\.


--
-- TOC entry 5030 (class 0 OID 24859)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, name, role, avatar, completed_count, created_at) FROM stdin;
1	andri_admin	$2b$10$TY0NYT2HByfuMJi.QYQfT.xF3bvbdmVr8AoSCGgELPEDKWDywbuyS	Andri Hermawan	admin	https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80	14	2026-06-08 09:26:54.995463
2	budi_support	$2b$10$TY0NYT2HByfuMJi.QYQfT.xF3bvbdmVr8AoSCGgELPEDKWDywbuyS	Budi Santoso	admin	https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80	9	2026-06-08 09:26:54.995463
3	citra_it	$2b$10$TY0NYT2HByfuMJi.QYQfT.xF3bvbdmVr8AoSCGgELPEDKWDywbuyS	Citra Lestari	admin	https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80	18	2026-06-08 09:26:54.995463
\.


--
-- TOC entry 5039 (class 0 OID 0)
-- Dependencies: 220
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_id_seq', 8, true);


--
-- TOC entry 5040 (class 0 OID 0)
-- Dependencies: 222
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- TOC entry 4873 (class 2606 OID 24876)
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 4875 (class 2606 OID 24878)
-- Name: tickets tickets_ticket_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_number_key UNIQUE (ticket_number);


--
-- TOC entry 4877 (class 2606 OID 24880)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4879 (class 2606 OID 24882)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4880 (class 2620 OID 24883)
-- Name: tickets ticket_changed_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER ticket_changed_trigger AFTER INSERT OR UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_changes();


-- Completed on 2026-06-08 10:03:58

--
-- PostgreSQL database dump complete
--

\unrestrict CXvve3vNTCOLHTwKO8CpagS9vQWjXA5TcUCcalApVodd79VihQftv5LRHc4BamO

