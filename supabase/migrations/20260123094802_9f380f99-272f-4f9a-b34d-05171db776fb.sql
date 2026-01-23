-- Fix manufacturer slugs to be URL-friendly (remove special characters)
UPDATE manufacturers SET slug = 'bowa-lotus' WHERE id = 'a5a8e27b-09c5-4055-8d58-a48ac666dd22';
UPDATE manufacturers SET slug = 'perlove-medical' WHERE id = 'ddee3c88-9570-4e7f-9657-59cade37e96b';
UPDATE manufacturers SET slug = 'ulrich' WHERE id = '75f5d55d-8f66-4a85-9eb0-d0fc0e8b1de9';
UPDATE manufacturers SET slug = 'aesculap' WHERE id = 'e7c70732-f4f6-42c7-acf3-bbf83a1036fa';
UPDATE manufacturers SET slug = 'snibe' WHERE id = '162f12e4-74fe-4d52-8217-19b3be424f91';
UPDATE manufacturers SET slug = 'bowa-electronic' WHERE id = 'fd15c407-ae83-48f9-a552-855145ba121f';
UPDATE manufacturers SET slug = 'lewin' WHERE id = '568d483c-d530-45bf-abf6-8d5cfdc361a8';
UPDATE manufacturers SET slug = 'beijing-siriusmed' WHERE id = '14c4d6d0-02c5-4db0-8bd1-1ee980a5d3c4';
UPDATE manufacturers SET slug = 'b-braun' WHERE id = '3a91fdb8-7fb4-462d-b89e-d4162ee4cccb';
UPDATE manufacturers SET slug = 'medcaptain' WHERE id = '832b781e-75b1-478b-8fba-c8955ef23d92';
UPDATE manufacturers SET slug = 'ritter-implants' WHERE id = '702cab9c-fcfd-471d-b8a2-612876b644bd';
UPDATE manufacturers SET slug = 'ysenmed' WHERE id = 'ebb2f10f-0193-493e-8157-c722263b17e1';

-- Fix product slugs that are NULL or contain only the ID
UPDATE products SET slug = 'magus-bio-250' WHERE id = 'a18f08c0-81fa-41d1-80c9-f3820b389085';
UPDATE products SET slug = 'magus-bio-260' WHERE id = 'd76f8b33-883e-4e76-b91f-e56d86d4504c';
UPDATE products SET slug = 'magus-bio-240' WHERE id = 'a3e8d88c-8aaa-4c3b-b3e5-1478fdcbaa45';