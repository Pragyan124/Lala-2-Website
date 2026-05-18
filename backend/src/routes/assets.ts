import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest, requireInventoryAccess } from '../middleware/auth';
import { encodePassword } from '../utils/encoding';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bill-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only images and PDFs are allowed'));
  }
});

const checkPermittedType = (req: AuthRequest, res: any, next: any) => {
  const user = req.user;
  const permittedType = user?.permitted_type?.toUpperCase();
  
  
  if (user?.role?.toUpperCase() === 'SUPERADMIN' || permittedType === 'ALL') return next();
  
  const requestedType = (req.body.type || req.query.type || req.params.type || '').toUpperCase();
  const assets = req.body.assets;


  // Check if any asset in bulk upload violates the permitted type
  if (Array.isArray(assets)) {
    const hasViolation = assets.some(a => (a.type || '').toUpperCase() !== permittedType);
    if (hasViolation) {
      return res.status(403).json({ error: `One or more items do not match your permitted type (${permittedType}).` });
    }
  } else if (requestedType && requestedType !== permittedType) {
    return res.status(403).json({ error: `You only have permission to manage ${permittedType} assets.` });
  }
  
  next();
};

router.get('/', authenticate, async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        machine: true,
        network: true,
        printer: true,
        server: true,
        creator: true
      }
    });

    const formatted = inventory.map(item => {
      let specificData: any = {};
      if (item.type === 'MACHINE' && item.machine) specificData = { ...item.machine };
      else if (item.type === 'NETWORK' && item.network) specificData = { ...item.network };
      else if (item.type === 'PRINTER' && item.printer) specificData = { ...item.printer };
      else if (item.type === 'SERVER' && item.server) specificData = { ...item.server };

      // Ensure we don't overwrite the Inventory ID with the sub-item ID
      const { id: subId, inventory_id, ...rest } = specificData;

      return {
        id: item.id,
        asset_tag: item.asset_tag,
        type: item.type,
        created_at: item.created_at,
        modified_at: item.modified_at,
        bill_url: item.bill_url,
        creator_name: item.creator?.username || item.created_by_name,
        ...rest
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.post('/', authenticate, requireInventoryAccess, checkPermittedType, async (req, res) => {
  console.log('Received Add Asset request:', req.body);
  try {
    const { type: rawType, asset_tag, ...data } = req.body;
    const type = rawType?.toUpperCase();
    const userId = req.user?.userId;
    const username = req.user?.username;

    const result = await prisma.$transaction(async (tx) => {
      const newInventory = await tx.inventory.create({
        data: {
          asset_tag,
          type,
          created_by: userId,
          created_by_name: username,
        }


      });

      if (type === 'MACHINE') {
        await tx.machine.create({
          data: {
            inventory_id: newInventory.id,
            asset_tag,
            subtype: data.subtype || 'Workstation',
            switch_type: data.switch_type,
            manufacturer: data.manufacturer,
            model_name: data.model_name,
            cpu_serial: data.cpu_serial,
            monitor_serial: data.monitor_serial,
            keyboard_serial: data.keyboard_serial,
            mouse_serial: data.mouse_serial,
            processor: data.processor,
            ram: data.ram,
            storage: data.storage,
            ip_address: data.ip_address,
            mac_address: data.mac_address,
            vlan: data.vlan,
            location: data.location,
            assigned_to: data.assigned_to,
            created_by: userId
          }
        });
      } else if (type === 'NETWORK') {
        await tx.network.create({
          data: {
            inventory_id: newInventory.id,
            asset_tag,
            manufacturer: data.manufacturer,
            model_name: data.model_name,
            ip_address: data.ip_address,
            assigned_to: data.assigned_to,
            created_by: userId
          }
        });
      } else if (type === 'PRINTER') {
        await tx.printer.create({
          data: {
            inventory_id: newInventory.id,
            asset_tag,
            manufacturer: data.manufacturer,
            model_name: data.model_name,
            serial_number: data.serial_number,
            assigned_to: data.assigned_to,
            location: data.location,
            created_by: userId
          }
        });
      } else if (type === 'SERVER') {
        await tx.server.create({
          data: {
            inventory_id: newInventory.id,
            asset_tag,
            manufacturer: data.manufacturer,
            serial_number: data.serial_number,
            os: data.os,
            location: data.location,
            assigned_to: data.assigned_to,
            created_by: userId
          }
        });
      }
      return newInventory;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Add Asset error details:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Asset Tag already exists', details: `The tag '${req.body.asset_tag}' is already in use.` });
    }
    res.status(400).json({ error: 'Failed to create asset', details: error.message });
  }
});

router.post('/bulk', authenticate, requireInventoryAccess, checkPermittedType, async (req, res) => {
  try {
    const { assets } = req.body;
    const userId = req.user?.userId;
    const username = req.user?.username;

    if (!Array.isArray(assets)) {
      return res.status(400).json({ error: 'Expected an array of assets' });
    }

    // Secondary check for bulk items if user is restricted
    const permittedType = req.user?.permitted_type;
    if (permittedType && permittedType !== 'ALL') {
      const hasInvalid = assets.some(a => (a.type || '').toUpperCase() !== permittedType);
      if (hasInvalid) {
        return res.status(403).json({ error: `Some items do not match your permitted type (${permittedType}).` });
      }
    }

    const results = await prisma.$transaction(async (tx) => {
      const createdAssets = [];
      for (const item of assets) {
        const { type: rawType, asset_tag, ...data } = item;
        const type = rawType?.toUpperCase();
        console.log(`Processing item: tag=${asset_tag}, rawType=${rawType}, normalizedType=${type}`);
        
        if (!type || !asset_tag) throw new Error(`Missing type or asset_tag for item`);

        const newInventory = await tx.inventory.upsert({
          where: { asset_tag },
          update: {
            type,
          },
          create: {
            asset_tag,
            type,
            created_by: userId,
            created_by_name: username,
          }


        });

        if (type === 'MACHINE') {
          await tx.machine.upsert({
            where: { inventory_id: newInventory.id },
            update: {
              asset_tag,
              subtype: data.subtype || 'Workstation',
              switch_type: data.switch_type,
              manufacturer: data.manufacturer || 'Unknown',
              model_name: data.model_name || 'Unknown',
              cpu_serial: data.cpu_serial,
              monitor_serial: data.monitor_serial,
              keyboard_serial: data.keyboard_serial,
              mouse_serial: data.mouse_serial,
              processor: data.processor,
              ram: data.ram,
              storage: data.storage,
              ip_address: data.ip_address,
              mac_address: data.mac_address,
              vlan: data.vlan,
              location: data.location,
              assigned_to: data.assigned_to,
            },
            create: {
              inventory_id: newInventory.id,
              asset_tag,
              subtype: data.subtype || 'Workstation',
              switch_type: data.switch_type,
              manufacturer: data.manufacturer || 'Unknown',
              model_name: data.model_name || 'Unknown',
              cpu_serial: data.cpu_serial,
              monitor_serial: data.monitor_serial,
              keyboard_serial: data.keyboard_serial,
              mouse_serial: data.mouse_serial,
              processor: data.processor,
              ram: data.ram,
              storage: data.storage,
              ip_address: data.ip_address,
              mac_address: data.mac_address,
              vlan: data.vlan,
              location: data.location,
              assigned_to: data.assigned_to,
              created_by: userId,
            }
          });
        } else if (type === 'NETWORK') {
          await tx.network.upsert({
            where: { inventory_id: newInventory.id },
            update: {
              asset_tag,
              manufacturer: data.manufacturer || 'Unknown',
              model_name: data.model_name || 'Unknown',
              ip_address: data.ip_address,
              assigned_to: data.assigned_to,
            },
            create: {
              inventory_id: newInventory.id,
              asset_tag,
              manufacturer: data.manufacturer || 'Unknown',
              model_name: data.model_name || 'Unknown',
              ip_address: data.ip_address,
              assigned_to: data.assigned_to,
              created_by: userId
            }
          });
        } else if (type === 'PRINTER') {
          await tx.printer.upsert({
            where: { inventory_id: newInventory.id },
            update: {
              asset_tag,
              manufacturer: data.manufacturer || 'Unknown',
              model_name: data.model_name || 'Unknown',
              serial_number: data.serial_number,
              assigned_to: data.assigned_to,
              location: data.location,
            },
            create: {
              inventory_id: newInventory.id,
              asset_tag,
              manufacturer: data.manufacturer || 'Unknown',
              model_name: data.model_name || 'Unknown',
              serial_number: data.serial_number,
              assigned_to: data.assigned_to,
              location: data.location,
              created_by: userId
            }
          });
        } else if (type === 'SERVER') {
          await tx.server.upsert({
            where: { inventory_id: newInventory.id },
            update: {
              asset_tag,
              manufacturer: data.manufacturer,
              serial_number: data.serial_number,
              os: data.os,
              location: data.location,
              assigned_to: data.assigned_to,
            },
            create: {
              inventory_id: newInventory.id,
              asset_tag,
              manufacturer: data.manufacturer,
              serial_number: data.serial_number,
              os: data.os,
              location: data.location,
              assigned_to: data.assigned_to,
              created_by: userId
            }
          });
        }
 else {
          throw new Error(`DEBUG: Invalid asset type: [${type}] from raw: [${rawType}]`);
        }
        createdAssets.push(newInventory);
      }
      return createdAssets;
    });

    res.status(201).json({ success: true, count: results.length });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    res.status(400).json({ error: 'Failed to bulk create assets', details: error.message });
  }
});

router.put('/:id', authenticate, requireInventoryAccess, checkPermittedType, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, asset_tag, ...data } = req.body;

    const inventory = await prisma.inventory.findUnique({ where: { id: Number(id) } });
    if (!inventory) return res.status(404).json({ error: 'Asset not found' });

    const permittedType = req.user?.permitted_type;
    if (permittedType && permittedType !== 'ALL' && inventory.type !== permittedType) {
       return res.status(403).json({ error: `You only have permission to manage ${permittedType} assets.` });
    }

    const updatedInventory = await prisma.inventory.update({
      where: { id: Number(id) },
      data: {
        asset_tag,
      }
    });

    if (type === 'MACHINE') {
      await prisma.machine.update({
        where: { inventory_id: Number(id) },
        data: {
          asset_tag,
          subtype: data.subtype || 'Workstation',
          switch_type: data.switch_type,
          manufacturer: data.manufacturer,
          model_name: data.model_name,
          cpu_serial: data.cpu_serial,
          monitor_serial: data.monitor_serial,
          keyboard_serial: data.keyboard_serial,
          mouse_serial: data.mouse_serial,
          processor: data.processor,
          ram: data.ram,
          storage: data.storage,
          ip_address: data.ip_address,
          mac_address: data.mac_address,
          vlan: data.vlan,
          location: data.location,
          assigned_to: data.assigned_to,
        }
      });
    } else if (type === 'NETWORK') {
      await prisma.network.update({
        where: { inventory_id: Number(id) },
        data: {
          asset_tag,
          manufacturer: data.manufacturer,
          model_name: data.model_name,
          ip_address: data.ip_address,
          assigned_to: data.assigned_to,
        }
      });
    } else if (type === 'PRINTER') {
      await prisma.printer.update({
        where: { inventory_id: Number(id) },
        data: {
          asset_tag,
          manufacturer: data.manufacturer,
          model_name: data.model_name,
          serial_number: data.serial_number,
          assigned_to: data.assigned_to,
          location: data.location,
        }
      });
    } else if (type === 'SERVER') {
      await prisma.server.update({
        where: { inventory_id: Number(id) },
        data: {
          asset_tag,
          manufacturer: data.manufacturer,
          serial_number: data.serial_number,
          os: data.os,
          location: data.location,
          assigned_to: data.assigned_to,
        }
      });
    }

    const updated = await prisma.inventory.findUnique({
      where: { id: Number(id) },
      include: {
        machine: true,
        network: true,
        printer: true,
        server: true,
        creator: true
      }
    });

    if (!updated) return res.status(404).json({ error: 'Asset not found after update' });

    let specificData: any = {};
    if (updated.type === 'MACHINE' && updated.machine) specificData = { ...updated.machine };
    else if (updated.type === 'NETWORK' && updated.network) specificData = { ...updated.network };
    else if (updated.type === 'PRINTER' && updated.printer) specificData = { ...updated.printer };
    else if (updated.type === 'SERVER' && updated.server) specificData = { ...updated.server };

    const { id: subId, inventory_id, ...rest } = specificData;

    res.json({
      id: updated.id,
      asset_tag: updated.asset_tag,
      type: updated.type,
      created_at: updated.created_at,
      modified_at: updated.modified_at,
      bill_url: updated.bill_url,
      creator_name: updated.creator?.username || updated.created_by_name,
      ...rest
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to update asset' });
  }
});

router.delete('/:id', authenticate, requireInventoryAccess, checkPermittedType, async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await prisma.inventory.findUnique({ where: { id: Number(id) } });
    if (!inventory) return res.status(404).json({ error: 'Asset not found' });

    const permittedType = req.user?.permitted_type;
    if (permittedType && permittedType !== 'ALL' && inventory.type !== permittedType) {
       return res.status(403).json({ error: `You only have permission to manage ${permittedType} assets.` });
    }

    await prisma.inventory.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete asset' });
  }
});

// backend/src/routes/users.ts

router.post('/bulk', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { users } = req.body;
    const adminId = req.user?.userId;

    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'Expected an array of users' });
    }

    // FIX: Remove duplicates from the array itself before starting the transaction
    // This keeps only the last occurrence of any specific username
    const uniqueUsers = Array.from(
      new Map(users.map((u) => [u.username.toLowerCase().trim(), u])).values()
    );

    const results = await prisma.$transaction(async (tx) => {
      const processedUsers = [];
      for (const item of uniqueUsers) {
        if (!item.username) continue; // Skip empty rows
        
        const newUser = await tx.user.upsert({
          where: { username: item.username },
          update: {
            role: item.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
            division: item.division || null,
            dco: item.dco || 'Guwahati',
            modified_by: adminId,
          },
          create: {
            username: item.username,
            password: encodePassword(item.password || item.username), // Default password is username
            role: item.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
            division: item.division || null,
            dco: item.dco || 'Guwahati',
            created_by: adminId,
          }
        });


        processedUsers.push(newUser);
      }
      return processedUsers;
    });

    res.status(201).json({ success: true, count: results.length });
  } catch (error: any) {
    console.error('Bulk user upload error:', error);
    res.status(400).json({ error: 'Unique constraint failed. Check for duplicate usernames.', details: error.message });
  }
});

router.post('/:id/bill', authenticate, upload.single('bill'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const bill_url = `/uploads/${req.file.filename}`;
    
    await prisma.inventory.update({
      where: { id: Number(id) },
      data: { bill_url }
    });

    res.json({ bill_url });
  } catch (error) {
    console.error('Bill upload error:', error);
    res.status(500).json({ error: 'Failed to upload bill' });
  }
});

router.post('/tag/:asset_tag/bill', authenticate, upload.single('bill'), async (req: AuthRequest, res) => {
  try {
    const { asset_tag } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const bill_url = `/uploads/${req.file.filename}`;
    
    const inventory = await prisma.inventory.findUnique({
      where: { asset_tag }
    });

    if (!inventory) {
      return res.status(404).json({ error: `Asset with tag ${asset_tag} not found` });
    }

    await prisma.inventory.update({
      where: { id: inventory.id },
      data: { bill_url }
    });

    res.json({ success: true, bill_url, asset_tag });
  } catch (error) {
    console.error('Bill upload by tag error:', error);
    res.status(500).json({ error: 'Failed to upload bill' });
  }
});

router.post('/bulk-apply-bill', authenticate, upload.single('bill'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const bill_url = `/uploads/${req.file.filename}`;
    
    // Update all inventory records at once
    const result = await prisma.inventory.updateMany({
      data: { bill_url }
    });

    res.json({ 
      success: true, 
      message: `Applied bill to all ${result.count} records`,
      count: result.count, 
      bill_url 
    });
  } catch (error) {
    console.error('Bulk apply bill error:', error);
    res.status(500).json({ error: 'Failed to apply bill to all records' });
  }
});

export default router;
