/**
 * Seed Coze Package Orders (fixed) — explicit fb_ tables
 *
 * Uses explicit tables:
 * - fb_user
 * - fb_coze_package_config
 * - fb_coze_package_orders
 *
 * Inserts 20 orders: 15 paid (4 refunded: 2 full, 2 partial), 5 unpaid
 */

const { Client } = require('pg');
const crypto = require('crypto');

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
  );
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function addMinutes(d, m) { return new Date(d.getTime() + m*60000); }

const PG_CONFIG = {
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 56866),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'buildingai',
};

const PREFIX = (process.env.DB_TABLE_PREFIX || 'fb_').trim();
const USER_TABLE = `${PREFIX}user`;
const CFG_TABLE = `${PREFIX}coze_package_config`;
const ORDER_TABLE = `${PREFIX}coze_package_orders`;

async function assertTable(client, table) {
  const { rows } = await client.query('SELECT to_regclass($1) AS rel', [table]);
  if (!rows[0] || !rows[0].rel) throw new Error(`Table '${table}' not found`);
}

async function getAdminUserId(client) {
  await assertTable(client, USER_TABLE);
  const resAdmin = await client.query(`SELECT id FROM ${USER_TABLE} WHERE username = 'admin' LIMIT 1`);
  if (resAdmin.rows.length) return resAdmin.rows[0].id;
  const resAny = await client.query(`SELECT id FROM ${USER_TABLE} LIMIT 1`);
  if (resAny.rows.length) return resAny.rows[0].id;
  throw new Error(`No user found in '${USER_TABLE}'.`);
}

async function ensurePackageConfigs(client) {
  await assertTable(client, CFG_TABLE);
  const res = await client.query(`SELECT id, name, duration, original_price, current_price FROM ${CFG_TABLE} ORDER BY created_at ASC`);
  const configs = res.rows.map(r => ({ id: r.id, name: r.name, duration: Number(r.duration), originalPrice: Number(r.original_price), currentPrice: Number(r.current_price) }));
  if (configs.length >= 3) return configs;

  const toInsert = [
    { name: '年度套餐', duration: 365, originalPrice: 999.00, currentPrice: 699.00, description: '年度套餐' },
    { name: '季度套餐', duration: 90, originalPrice: 399.00, currentPrice: 299.00, description: '季度套餐' },
    { name: '月度套餐', duration: 30, originalPrice: 149.00, currentPrice: 99.00, description: '月度套餐' },
  ];

  const inserted = [];
  for (const pkg of toInsert.slice(configs.length)) {
    const id = uuid();
    await client.query(
      `INSERT INTO ${CFG_TABLE} (id, name, duration, original_price, current_price, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [id, pkg.name, pkg.duration, pkg.originalPrice, pkg.currentPrice, pkg.description]
    );
    inserted.push({ id, name: pkg.name, duration: pkg.duration, originalPrice: pkg.originalPrice, currentPrice: pkg.currentPrice });
  }
  return configs.concat(inserted);
}

function buildOrderRows({ userId, configs }) {
  const rows = [];
  let orderNoCounter = 1;

  const totalCount = 20;
  const paidCount = 15;
  const unpaidCount = totalCount - paidCount; // 5
  const refundFullCount = 2;
  const refundPartialCount = 2;

  const paymentMethods = ['wechat', 'alipay'];

  for (let i = 0; i < paidCount; i++) {
    const cfg = randChoice(configs);
    const quantity = 1;
    const totalAmount = cfg.currentPrice * quantity;
    const discountAmount = Math.max(0, Number((cfg.originalPrice - cfg.currentPrice).toFixed(2)));
    const paidAmount = totalAmount;
    const createdAt = daysAgo(randInt(0, 29));
    const paidAt = addMinutes(createdAt, randInt(5, 120));
    const paymentMethod = randChoice(paymentMethods);
    const orderNo = String(orderNoCounter).padStart(8, '0');
    orderNoCounter++;

    let refundStatus = 'none';
    let refundAmount = 0;
    let refundAt = null;
    let paymentStatus = 'paid';

    if (i < (refundFullCount + refundPartialCount)) {
      if (i < refundFullCount) {
        refundStatus = 'approved';
        refundAmount = paidAmount;
        refundAt = addMinutes(paidAt, randInt(10, 240));
        paymentStatus = 'refunded';
      } else {
        refundStatus = 'approved';
        refundAmount = Number((paidAmount * 0.3).toFixed(2));
        refundAt = addMinutes(paidAt, randInt(10, 240));
        paymentStatus = 'partialRefund';
      }
    }

    rows.push({
      id: uuid(),
      orderNo,
      userId,
      cfg,
      quantity,
      totalAmount,
      discountAmount,
      paidAmount,
      paymentMethod,
      orderStatus: 'paid',
      paymentStatus,
      refundStatus,
      transactionId: 'TX' + uuid().replace(/-/g, '').slice(0, 24),
      orderSource: 'web',
      orderType: 'coze-package',
      paidAt,
      expiredAt: null,
      refundAmount,
      refundReason: refundAmount > 0 ? '测试退款' : null,
      refundAt,
      remark: null,
      metadata: null,
      createdAt,
      updatedAt: addMinutes(createdAt, randInt(1, 5)),
    });
  }

  for (let i = 0; i < unpaidCount; i++) {
    const cfg = randChoice(configs);
    const quantity = 1;
    const totalAmount = cfg.currentPrice * quantity;
    const discountAmount = Math.max(0, Number((cfg.originalPrice - cfg.currentPrice).toFixed(2)));
    const createdAt = daysAgo(randInt(0, 29));
    const orderNo = String(orderNoCounter).padStart(8, '0');
    orderNoCounter++;

    rows.push({
      id: uuid(),
      orderNo,
      userId,
      cfg,
      quantity,
      totalAmount,
      discountAmount,
      paidAmount: 0,
      paymentMethod: randChoice(paymentMethods),
      orderStatus: 'pending',
      paymentStatus: 'unpaid',
      refundStatus: 'none',
      transactionId: null,
      orderSource: 'web',
      orderType: 'coze-package',
      paidAt: null,
      expiredAt: null,
      refundAmount: 0,
      refundReason: null,
      refundAt: null,
      remark: null,
      metadata: null,
      createdAt,
      updatedAt: addMinutes(createdAt, randInt(1, 5)),
    });
  }

  return rows;
}

async function insertOrders(client, rows) {
  await assertTable(client, ORDER_TABLE);
  const sql = `
    INSERT INTO ${ORDER_TABLE} (
      id, order_no, user_id, package_config_id,
      package_name, package_type, package_description,
      package_original_price, package_current_price, package_duration,
      quantity, total_amount, discount_amount, paid_amount,
      payment_method, order_status, payment_status, refund_status,
      transaction_id, order_source, order_type, paid_at, expired_at,
      refund_amount, refund_reason, refund_at, remark, metadata,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7,
      $8, $9, $10,
      $11, $12, $13, $14,
      $15, $16, $17, $18,
      $19, $20, $21, $22, $23,
      $24, $25, $26, $27, $28,
      $29, $30
    )
  `;

  for (const r of rows) {
    await client.query(sql, [
      r.id,
      r.orderNo,
      r.userId,
      r.cfg.id,
      r.cfg.name,
      'basic',
      r.cfg.description || r.cfg.name,
      r.cfg.originalPrice,
      r.cfg.currentPrice,
      r.cfg.duration,
      r.quantity,
      r.totalAmount,
      r.discountAmount,
      r.paidAmount,
      r.paymentMethod,
      r.orderStatus,
      r.paymentStatus,
      r.refundStatus,
      r.transactionId,
      r.orderSource,
      r.orderType,
      r.paidAt,
      r.expiredAt,
      r.refundAmount,
      r.refundReason,
      r.refundAt,
      r.remark,
      r.metadata,
      r.createdAt,
      r.updatedAt,
    ]);
  }
}

async function main() {
  console.log('[seed-coze-orders-fixed] Connecting:', PG_CONFIG);
  const client = new Client(PG_CONFIG);
  await client.connect();
  try {
    await client.query('BEGIN');

    const userId = await getAdminUserId(client);
    console.log('Using userId:', userId);

    const configs = await ensurePackageConfigs(client);
    console.log('Package configs ready:', configs.map(c => `${c.name}/${c.duration}天`).join(', '));

    const rows = buildOrderRows({ userId, configs });
    await insertOrders(client, rows);

    await client.query('COMMIT');
    const totals = rows.reduce((acc, r) => {
      acc.totalOrders += 1;
      acc.totalAmount += r.totalAmount;
      acc.refundOrders += r.refundAmount > 0 ? 1 : 0;
      acc.refundAmount += r.refundAmount;
      return acc;
    }, { totalOrders: 0, totalAmount: 0, refundOrders: 0, refundAmount: 0 });
    const netIncome = Number((totals.totalAmount - totals.refundAmount).toFixed(2));
    console.log('Inserted orders:', rows.length);
    console.log('Summary:', {
      totalOrders: totals.totalOrders,
      totalAmount: Number(totals.totalAmount.toFixed(2)),
      refundOrders: totals.refundOrders,
      refundAmount: Number(totals.refundAmount.toFixed(2)),
      netIncome,
    });
    console.log('✅ Seed completed. Refresh admin page to see statistics.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();