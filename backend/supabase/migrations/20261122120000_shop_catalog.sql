-- Cosmetic shop catalog: the items for sale at launch
-- This is real game content, so it lives in a migration (seed.sql only runs locally).
-- To add items later, write a new migration; don't edit this one once it's merged.
-- `on conflict (name) do nothing` makes it safe to run against a database that already has some of these.
-- style keys must match CosmeticStyle in shared/Cosmetics.ts (pattern, color, accent, gradient, text, animation).

insert into public.shop_item (name, description, item_type, rarity, cost, asset_url, style, sort_order)
values
  -- Avatars: image files in frontend/public/cosmetic/avatar/
  ('Panda',       'Calm, cuddly, and somehow still taking your chips.', 'avatar', 'common',     200, '/cosmetic/avatar/panda.svg',       '{}', 10),
  ('Wise Owl',    'Monocle on. Every tell noted.',                      'avatar', 'common',     250, '/cosmetic/avatar/wise-owl.svg',    '{}', 20),
  ('Poker Face',  'Totally relaxed. Ignore the sweat.',                 'avatar', 'common',     300, '/cosmetic/avatar/poker-face.svg',  '{}', 30),
  ('Ace',         'Shades on, cards close, read nothing.',              'avatar', 'rare',       500, '/cosmetic/avatar/ace.svg',         '{}', 40),
  ('The Cowboy',  'Rides in, takes the pot, tips the hat.',             'avatar', 'rare',       550, '/cosmetic/avatar/the-cowboy.svg',  '{}', 50),
  ('Lucky Lou',   'Headphones on, world off, stacks up.',               'avatar', 'rare',       700, '/cosmetic/avatar/lucky-lou.svg',   '{}', 60),
  ('The Dealer',  'Green visor, steady hands, seen it all.',            'avatar', 'epic',      1200, '/cosmetic/avatar/the-dealer.svg',  '{}', 70),
  ('Sly Fox',     'Grins first, explains never.',                       'avatar', 'epic',      1400, '/cosmetic/avatar/sly-fox.svg',     '{}', 80),
  ('High Roller', 'Gold chain, black hat, no buy-in too big.',          'avatar', 'legendary', 2500, '/cosmetic/avatar/high-roller.svg', '{}', 90),
  ('Money Eyes',  'Only one thing on their mind.',                      'avatar', 'legendary', 3000, '/cosmetic/avatar/money-eyes.svg',  '{}', 100),

  -- Card backs: drawn in CSS from pattern + colours, no image files
  ('Crimson Classic',  'The house deck, sharpened with gold trim.',      'card_back', 'common',     200, null, '{"pattern": "solid",   "color": "#7a0f14", "accent": "#d4a24c"}', 10),
  ('Midnight Lattice', 'Black and silver crosshatch. All business.',     'card_back', 'common',     300, null, '{"pattern": "lattice", "color": "#16161a", "accent": "#c0c0c8"}', 20),
  ('Emerald Felt',     'Cut from the same cloth as the table.',          'card_back', 'rare',       550, null, '{"pattern": "lattice", "color": "#0b5d3b", "accent": "#e9c46a"}', 30),
  ('Diamond Flare',    'Crimson rays burst from a bright diamond core.', 'card_back', 'rare',       650, null, '{"pattern": "rays",    "color": "#8b0d12", "accent": "#ff5a5f"}', 40),
  ('Sapphire Vault',   'Cold blue rings, locked tight at the center.',   'card_back', 'epic',      1200, null, '{"pattern": "rings",   "color": "#0d2a5c", "accent": "#5aa9ff"}', 50),
  ('Gold Foil',        'Hammered gold that flashes every deal.',         'card_back', 'legendary', 3000, null, '{"pattern": "rays",    "color": "#6b4a0f", "accent": "#f2c14e", "animation": "shimmer"}', 60),

  -- Avatar borders: a CSS ring around the portrait
  ('Silver Ring',    'A clean silver band. Never out of style.',      'avatar_border', 'common',     200, null, '{"color": "#c0c0c8"}', 10),
  ('Ruby Glow',      'A deep red ring lit like the felt at midnight.', 'avatar_border', 'rare',       650, null, '{"color": "#e0115f", "animation": "glow"}', 20),
  ('Sapphire Pulse', 'Electric blue, pulsing like a river card.',     'avatar_border', 'epic',      1300, null, '{"color": "#3b82f6", "animation": "glow"}', 30),
  ('Gilded Halo',    'Polished gold. The whole table will notice.',   'avatar_border', 'legendary', 3000, null, '{"color": "#f2c14e", "animation": "shimmer"}', 40),

  -- Name tags: the subtitle shown under your name
  ('Rookie Luck',     'For the ones still calling it skill.',                   'name_tag', 'common',     150, null, '{"text": "Rookie Luck",     "color": "#b8b0b0"}', 10),
  ('Draw Specialist', 'Five-card draw is your game, and now everyone knows it.', 'name_tag', 'common',     250, null, '{"text": "Draw Specialist", "color": "#d8cfcf"}', 20),
  ('All In',          'No hesitation. No regrets. Usually.',                    'name_tag', 'rare',       550, null, '{"text": "All In",          "color": "#ff6b6b"}', 30),
  ('Card Shark',      'A fair warning to whoever sits beside you.',             'name_tag', 'rare',       600, null, '{"text": "Card Shark",      "color": "#5aa9ff"}', 40),
  ('Table Royalty',   'Wear the crown, deal the cards.',                        'name_tag', 'epic',      1200, null, '{"text": "Table Royalty",   "color": "#e9c46a"}', 50),
  ('Big Spender',     'Gold, shimmering, impossible to miss.',                  'name_tag', 'legendary', 3500, null, '{"text": "Big Spender",     "color": "#f2c14e", "animation": "shimmer"}', 60),

  -- Emotes: the emoji lives in style.text and pops up over your seat
  ('Thumbs Up', 'Nice...',                                'emote', 'common',     150, null, '{"text": "👍"}', 10),
  ('Nice Hand', 'Good sportsmanship looks good on you.',  'emote', 'common',     150, null, '{"text": "👏"}', 20),
  ('Sweating',  'That river card was way too close.',     'emote', 'rare',       450, null, '{"text": "😅"}', 30),
  ('Big Laugh', 'For when they fold the winning hand.',   'emote', 'rare',       500, null, '{"text": "😂"}', 40),
  ('Shocked',   'Rivered again? Let the table see it.',   'emote', 'epic',      1000, null, '{"text": "😱"}', 50),
  ('Crown',     'Took the pot? Claim your throne.',       'emote', 'legendary', 2500, null, '{"text": "👑"}', 60)
on conflict (name) do nothing;
