import bcrypt from 'bcryptjs';
import { sequelize, User, Hub, Listing, Conversation, Message, Offer } from '../models/index.ts';
import img from './seedImages.json' with { type: 'json' };

/** Resets all data and loads demo content matching the O-Rion designs. Password for every account: password123 */
async function seed() {
  await sequelize.transaction(async (transaction) => {
    await sequelize.query('TRUNCATE messages, offers, conversations, favorites, listings, hubs, users CASCADE', { transaction });
    const passwordHash = await bcrypt.hash('password123', 10);

    const [ada, tobi, chioma, femi] = await User.bulkCreate(
      [
        { name: 'Ada Okafor', email: 'ada@live.unilag.edu.ng', passwordHash, department: "Mass Comm '26", avatarUrl: img.avatarProfile, verified: true, rating: 4.9, tradesCount: 23, responseTime: 'Replies in 10m' },
        { name: 'Tobi Alabi', email: 'tobi@live.unilag.edu.ng', passwordHash, department: "Unilag Eng '25", avatarUrl: img.avatarTobi, verified: true, rating: 4.9, tradesCount: 142, responseTime: 'Replies in 5m' },
        { name: 'Chioma Eze', email: 'chioma@live.unilag.edu.ng', passwordHash, department: "Medicine '27", avatarUrl: img.avatarStudent, verified: true, rating: 4.8, tradesCount: 89, responseTime: 'Replies in 20m' },
        { name: 'Femi Adeyemi', email: 'femi@gmail.com', passwordHash, department: "Computer Sci '25", verified: false, rating: 4.6, tradesCount: 12, responseTime: 'Replies in 1h' },
      ],
      { transaction, returning: true },
    );

    const [ikeja, quad, computerVillage] = await Hub.bulkCreate(
      [
        { name: 'Ikeja Tech Hub / Campus Security Post', area: 'Ikeja, Lagos', description: 'Designated safe exchange zone · High foot traffic · Testing bench', features: ['CCTV', 'Power outlets', 'Testing bench'] },
        { name: 'UNILAG Library Quad Safe Spot', area: 'UNILAG, Akoka', description: 'Beside the main library security desk · Open 8am–8pm', features: ['CCTV', 'Security desk', 'Wi-Fi'] },
        { name: 'Computer Village Inspection Desk', area: 'Ikeja, Lagos', description: 'Partner technicians verify IMEI, battery and serials', features: ['CCTV', 'IMEI check', 'Technician on site'] },
      ],
      { transaction, returning: true },
    );

    const listings = await Listing.bulkCreate(
      [
        {
          sellerId: tobi.id, hubId: ikeja.id, title: 'Sony WH-1000XM4 ANC', category: 'audio', condition: 'certified_refurbished', grade: 'A+',
          price: 98000, originalPrice: 180000, images: [img.sonyBlack, img.sonyBlue, img.sonyBlueSide],
          description: 'Battery lasts an easy 30+ hours on a full charge. Noise cancelling works flawlessly. Original retail box, airplane adapter and 3.5mm aux cord included.',
          tags: ['30-Pt Inspected', '6-Mo Warranty'], checks: { batteryHealth: 94, functionalTested: true, originalBox: true, proofOfPurchase: true, serialVerified: true },
          warrantyMonths: 6, location: 'Ikeja Hub', inspected: true, views: 312,
        },
        {
          sellerId: chioma.id, hubId: computerVillage.id, title: 'iPad Air 4th Gen 64GB Sky Blue', category: 'tablets', condition: 'pre_owned_excellent', grade: 'A',
          price: 265000, originalPrice: 420000, images: [img.ipad], description: 'Pencil included. No scratches on screen, always used with a case.',
          tags: ['Battery 94%', 'Pencil Incl.'], checks: { batteryHealth: 94, functionalTested: true, originalBox: false, proofOfPurchase: true, serialVerified: true },
          warrantyMonths: 3, location: 'Computer Village', inspected: true, views: 254,
        },
        {
          sellerId: femi.id, hubId: quad.id, title: 'Logitech MX Master 3 Mouse', category: 'other', condition: 'pre_owned_excellent', grade: 'A',
          price: 38000, originalPrice: 75000, images: [img.mouse], description: 'Graphite. USB-C charging, works on glass.',
          tags: ['Bluetooth + Receiver'], checks: { functionalTested: true, originalBox: true }, warrantyMonths: 0, location: 'UNILAG, Akoka', inspected: false, views: 98,
        },
        {
          sellerId: ada.id, hubId: quad.id, title: 'Fujifilm Instax Mini 11', category: 'cameras', condition: 'pre_owned_excellent',
          price: 34000, originalPrice: 62000, images: [img.instax], description: 'Lilac purple. Comes with 2 film packs.',
          tags: ['Inspected at Hub'], checks: { functionalTested: true, originalBox: true }, location: 'UNILAG, Akoka', inspected: true, views: 141,
        },
        {
          sellerId: chioma.id, title: 'Minimalist Desk Lamp', category: 'home', condition: 'pre_owned_fair',
          price: 9500, originalPrice: 18000, images: [img.lamp], description: 'Warm-white LED, wooden base. Perfect for hostel reading.',
          tags: ['Inspected at Computer Village'], checks: { functionalTested: true }, location: 'Moremi Hall', inspected: true, views: 67,
        },
        {
          sellerId: tobi.id, title: 'Stewart Calculus 9th Edition', category: 'books', condition: 'pre_owned_excellent',
          price: 7500, originalPrice: 15000, images: [img.calculus], description: 'Complete, unmarked pages. Needed for MTH 101/102.',
          tags: ['Complete Unmarked Pages'], checks: {}, location: 'Faculty of Science', inspected: false, views: 203,
        },
        {
          sellerId: femi.id, title: 'Nike Dunk Low Panda (EU 43)', category: 'fashion', condition: 'pre_owned_excellent',
          price: 32000, originalPrice: 85000, images: [img.dunk], description: 'Worn 3 times. Authenticity verified at Sneaker Hub.',
          tags: ['Authenticity Verified'], checks: { originalBox: true, proofOfPurchase: true }, location: 'Jaja Hall', inspected: true, views: 176,
        },
      ],
      { transaction, returning: true },
    );

    // Demo negotiation from the "Chat Negotiation" design: Ada (buyer) ↔ Tobi (seller) about the Sony XM4.
    const sony = listings[0];
    const convo = await Conversation.create({ listingId: sony.id, buyerId: ada.id, sellerId: tobi.id }, { transaction });
    const at = (minsAgo: number) => new Date(Date.now() - minsAgo * 60_000);
    await Message.bulkCreate(
      [
        { conversationId: convo.id, senderId: null, type: 'system', body: 'Inquired from Unilag Campus Feed', createdAt: at(30), updatedAt: at(30) },
        { conversationId: convo.id, senderId: ada.id, body: 'Hey Tobi! Is this still available? Can you do a quick sound & ANC test before we meet at the Library Quad?', createdAt: at(29), updatedAt: at(29), readAt: at(28) },
        { conversationId: convo.id, senderId: tobi.id, body: 'Hey! Yes still available! Battery lasts an easy 30+ hours on full charge and noise cancelation works flawlessly. Original retail box, airplane adapter and 3.5mm aux cord are intact too.', createdAt: at(27), updatedAt: at(27), readAt: at(26) },
      ],
      { transaction },
    );
    const offer = await Offer.create(
      { conversationId: convo.id, listingId: sony.id, buyerId: ada.id, hubId: ikeja.id, amount: 93000, note: 'Can test ANC and pick up today at 4:30pm sharp at the Certified Safe Hub testing station.', expiresAt: new Date(Date.now() + 18 * 3600_000), createdAt: at(25), updatedAt: at(25) },
      { transaction },
    );
    await Message.bulkCreate(
      [
        { conversationId: convo.id, senderId: ada.id, type: 'offer', offerId: offer.id, body: 'Escrow offer: ₦93,000', createdAt: at(25), updatedAt: at(25), readAt: at(24) },
        { conversationId: convo.id, senderId: tobi.id, body: '₦93,000 works if you can meet today before 5:00 PM! I have a lecture in the faculty annex till 4:15 anyway.', createdAt: at(20), updatedAt: at(20) },
      ],
      { transaction },
    );
    await convo.update({ lastMessageAt: at(20) }, { transaction });
  });
  console.log('Seeded. Log in as ada@live.unilag.edu.ng / password123 (or tobi@, chioma@ …)');
}

try {
  await seed();
} finally {
  await sequelize.close();
}
