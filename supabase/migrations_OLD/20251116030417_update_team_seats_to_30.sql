/*
  # Update Team Subscription Seats to 30

  ## Changes
  - Change default seats from 1 to 30 for both trial and paid team subscriptions
  - Update existing team tier subscriptions to have 30 seats
  - Pro tier remains at 1 seat

  ## Details
  Team tier should support up to 30 members during both trial and paid periods.
*/

-- Update existing team tier subscriptions to have 30 seats
UPDATE subscriptions
SET seats = 30
WHERE tier = 'team' AND seats < 30;

-- Note: We'll handle the default value at the application level
-- since we want different defaults based on tier (Pro=1, Team=30)

-- Add a comment to document the expected seat counts
COMMENT ON COLUMN subscriptions.seats IS 'Number of seats: Pro tier = 1 seat, Team tier = 30 seats';