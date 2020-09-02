const checkUserQuery = `
SELECT COUNT(phone_number)
FROM users
WHERE phone_number = $1
`;

const newUserQuery = `
INSERT INTO users(phone_number, city, state, country, zip)
VALUES($1, $2, $3, $4, $5)
`;

const recordTextQuery = `
INSERT INTO texts_received(phone_number, text)
VALUES($1, $2)
`;

const selectNearest = `
SELECT id, name, category, hours, place_id, plus_code_compound, hours_last_updated,
(3959 * acos(cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2) ) + sin(radians($1)) * sin(radians(lat)))) 
AS distance 
FROM bathrooms
GROUP BY id, name, category, hours, place_id, plus_code_compound, hours_last_updated
HAVING (3959 * acos(cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2) ) + sin(radians($1)) * sin(radians(lat)))) < 5
ORDER BY distance
LIMIT $3
OFFSET $4`;

const getPageNo = `
SELECT next_page_no
FROM users
WHERE phone_number = $1`;

const deleteDupes = `
DELETE FROM bathrooms a
USING bathrooms b
WHERE a.id > b.id
AND a.place_id = b.place_id
RETURNING *
`;

const updateHours = `
UPDATE bathrooms
SET hours = $1, hours_last_updated = NOW()
WHERE id = $2
RETURNING *
`;

const updateName = `
UPDATE bathrooms
SET name = $1
WHERE id = $2
RETURNING *
`;

const updateActive = `
UPDATE users
SET last_active = NOW()
WHERE phone_number = $1
`;

const getDiffLastActive = `
SELECT age(NOW(), last_active) 
FROM users 
WHERE phone_number = $1
`;

const updateLoc = `
UPDATE users
SET active_loc_lng = $1,
active_loc_lat = $2
WHERE phone_number = $3
`;

const getLoc = `
SELECT active_loc_lng, active_loc_lat
FROM users
WHERE phone_number = $1
`;

const incrementPageNo = `
UPDATE users
SET next_page_no = $1
WHERE phone_number = $2
RETURNING *
`;

const submitRequest = `
INSERT INTO new_bathroom_requests(name, category, address, hours) 
VALUES($1, $2, $3, $4)
`;

const getByPlaceId = `
SELECT *
FROM bathrooms
WHERE place_id = $1`;

const addBathroom = `
INSERT INTO bathrooms(name, category, address, hours, handicap, formatted_address, 
  lat, lng, location_type, viewport_ne_lat, viewport_ne_lng, viewport_sw_lat, 
  viewport_sw_lng, place_id, plus_code_compound, plus_code_global, types) 
  VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`;

module.exports = {
  checkUserQuery,
  newUserQuery,
  recordTextQuery,
  selectNearest,
  getPageNo,
  deleteDupes,
  updateHours,
  updateName,
  updateActive,
  getDiffLastActive,
  updateLoc,
  getLoc,
  incrementPageNo,
  submitRequest,
  getByPlaceId,
  addBathroom,
};
