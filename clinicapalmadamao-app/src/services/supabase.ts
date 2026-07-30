import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ezkfnbrlqnruymhhfeei.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2ZuYnJscW5ydXltaGhmZWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjg1MzAsImV4cCI6MjA5MDgwNDUzMH0.llrWSk5Kz-UvTPWY5fpeO7QD-aFaobcvAP9FxH8PhB4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
