drop index if exists public.ad_claim_once_a_day;

alter table public.ad_claim drop constraint ad_claim_ad_id_fkey;
alter table public.ad_claim
  add constraint ad_claim_ad_id_fkey foreign key (ad_id) references public.advert(id) on delete cascade;
