import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TaskMint Database Seeding...');

  // 1. System Settings
  const settings = [
    { key: 'ACTIVATION_FEE_KES', value: '100', description: 'Platform activation fee to prevent spam' },
    { key: 'MIN_WITHDRAWAL_KES', value: '2500', description: 'Minimum withdrawable balance' },
    { key: 'PAYOUT_DAY', value: 'Friday', description: 'Weekly payout processing day' },
    { key: 'PAYOUT_WINDOW', value: '09:00 AM - 05:00 PM EAT', description: 'Payout hours' },
    { key: 'PLATFORM_NAME', value: 'TaskMint', description: 'Branding technology name' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 2. Membership Packages
  const packages = [
    {
      name: 'BRONZE',
      price: 100.0,
      description: 'Entry-level access to basic microtasks and ad viewing.',
      taskLimitDaily: 5,
      dataAnnotationAccess: true,
      watchAdsLimit: 5,
      whatsappTasksLimit: 1,
      referralBonus: 50.0,
      durationDays: 30,
      isActive: true,
      featuresJson: JSON.stringify([
        'Access to basic data microtasks',
        'Watch up to 5 sponsored ads daily',
        '1 WhatsApp status task / week',
        'Standard payout queue',
        'KES 50 referral reward'
      ]),
    },
    {
      name: 'SILVER',
      price: 500.0,
      description: 'Intermediate tier with higher task capacity and priority access.',
      taskLimitDaily: 15,
      dataAnnotationAccess: true,
      watchAdsLimit: 15,
      whatsappTasksLimit: 3,
      referralBonus: 100.0,
      durationDays: 30,
      isActive: true,
      featuresJson: JSON.stringify([
        'Higher daily task limits (15/day)',
        'Access to sentiment & text annotation',
        'Watch up to 15 ads daily',
        'Priority task queueing',
        'KES 100 referral reward'
      ]),
    },
    {
      name: 'GOLD',
      price: 1500.0,
      description: 'Advanced package for high-capacity task workers and annotators.',
      taskLimitDaily: 35,
      dataAnnotationAccess: true,
      watchAdsLimit: 30,
      whatsappTasksLimit: 8,
      referralBonus: 250.0,
      durationDays: 30,
      isActive: true,
      featuresJson: JSON.stringify([
        'High daily task limits (35/day)',
        'Advanced image & audio annotation tasks',
        'Up to 30 ad view rewards daily',
        '8 WhatsApp promo tasks / week',
        'KES 250 referral reward',
        'Priority support handling'
      ]),
    },
    {
      name: 'PLATINUM',
      price: 3000.0,
      description: 'Highest platform tier with max task allocations and premium promo campaigns.',
      taskLimitDaily: 100,
      dataAnnotationAccess: true,
      watchAdsLimit: 75,
      whatsappTasksLimit: 20,
      referralBonus: 500.0,
      durationDays: 30,
      isActive: true,
      featuresJson: JSON.stringify([
        'Maximum task limits (100/day)',
        'Exclusive AI training dataset tasks',
        'Up to 75 ad views daily',
        '20 WhatsApp promo campaigns / week',
        'KES 500 referral reward',
        'VIP instant processing queue'
      ]),
    },
  ];

  const packageMap: Record<string, string> = {};

  for (const pkg of packages) {
    const created = await prisma.membershipPackage.upsert({
      where: { name: pkg.name },
      update: pkg,
      create: pkg,
    });
    packageMap[pkg.name] = created.id;
  }

  // 3. Task Categories
  const categories = [
    { name: 'Image Labelling', slug: 'image-labelling', icon: 'BrainCircuit', description: 'Draw bounding boxes and label produce, object, or street images.' },
    { name: 'Data Annotation', slug: 'data-annotation', icon: 'BrainCircuit', description: 'Classify text sentiment, entity tagging, and data dataset validation.' },
    { name: 'Audio Transcription', slug: 'audio-transcription', icon: 'FileText', description: 'Transcribe Swahili or English voice recordings to text.' },
    { name: 'WhatsApp Posting', slug: 'whatsapp-posting', icon: 'Share2', description: 'Post campaign promotional material to status and submit screenshot proof.' },
    { name: 'Watching Ads', slug: 'watching-ads', icon: 'PlaySquare', description: 'Watch brand sponsor video advertisements to earn instant rewards.' },
    { name: 'Following Channels (Instagram, YouTube)', slug: 'following-channels', icon: 'Users', description: 'Follow official social media pages or subscribe to YouTube channels.' },
    { name: 'Web Testing', slug: 'web-testing', icon: 'Zap', description: 'Test website navigation, speed, and responsiveness, then submit feedback.' },
    { name: 'App Testing', slug: 'app-testing', icon: 'Smartphone', description: 'Install and test mobile application features and submit review screenshots.' },
    { name: 'Surveys & Reviews', slug: 'surveys-reviews', icon: 'CheckSquare', description: 'Complete market research questionnaires and brand opinion surveys.' },
    { name: 'User Experience Product Comparison', slug: 'product-comparison', icon: 'Layers', description: 'Compare e-commerce or product features and rate user experience.' },
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categories) {
    const created = await prisma.taskCategory.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat,
    });
    categoryMap[cat.slug] = created.id;
  }

  // 4. Create Admin Account
  const adminPasswordHash = await bcrypt.hash('BAGIK@123#', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'ADMIN' },
    update: {},
    create: {
      fullName: 'System Administrator',
      username: 'ADMIN',
      email: 'admin@taskmint.co.ke',
      phone: '254700000000',
      mpesaNumber: '254700000000',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      referralCode: 'ADMIN001',
      packageId: packageMap['PLATINUM'],
      wallet: {
        create: {
          availableBalance: 50000.0,
          pendingBalance: 0.0,
          totalEarned: 50000.0,
        },
      },
    },
  });

  // 5. Create Sample User Account
  const userPasswordHash = await bcrypt.hash('User@12345', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'john@example.co.ke' },
    update: {},
    create: {
      fullName: 'John Kamau',
      username: 'johnkamau',
      email: 'john@example.co.ke',
      phone: '254712345678',
      mpesaNumber: '254712345678',
      passwordHash: userPasswordHash,
      role: 'USER',
      status: 'ACTIVE',
      isVerified: true,
      referralCode: 'KAMAU254',
      packageId: packageMap['GOLD'],
      packageExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      wallet: {
        create: {
          availableBalance: 2850.0,
          pendingBalance: 450.0,
          totalEarned: 3300.0,
          totalWithdrawn: 0.0,
        },
      },
    },
  });

  // Add initial wallet transactions for demo user
  const demoWallet = await prisma.wallet.findUnique({ where: { userId: demoUser.id } });
  if (demoWallet) {
    await prisma.walletTransaction.createMany({
      data: [
        {
          walletId: demoWallet.id,
          userId: demoUser.id,
          amount: 100.0,
          type: 'ACTIVATION_FEE',
          status: 'COMPLETED',
          description: 'Account activation access payment',
        },
        {
          walletId: demoWallet.id,
          userId: demoUser.id,
          amount: 450.0,
          type: 'TASK_REWARD',
          status: 'COMPLETED',
          description: 'Approved Image Labeling Dataset #402',
        },
        {
          walletId: demoWallet.id,
          userId: demoUser.id,
          amount: 2300.0,
          type: 'REFERRAL_REWARD',
          status: 'COMPLETED',
          description: 'Referral rewards for qualified team invites',
        },
      ],
    });
  }

  // 6. Sample Data Annotation Tasks
  const annotationTasks = [
    {
      title: 'Kenyan Market Produce Classification',
      instructions: 'Review 5 photos of Kenyan market items (Sukuma wiki, Tomatoes, Maize, Matoke, Avocados) and select the correct category tag for each image.',
      categoryId: categoryMap['data-annotation'],
      reward: 120.0,
      minPackageTier: 'BRONZE',
      durationSeconds: 120,
      totalSlots: 200,
      remainingSlots: 184,
      status: 'ACTIVE',
      dataPayloadJson: JSON.stringify({
        items: [
          { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600', options: ['Greens/Sukuma Wiki', 'Tomatoes', 'Onions', 'Maize'] },
          { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600', options: ['Avocados', 'Tomatoes', 'Bananas', 'Potatoes'] }
        ]
      })
    },
    {
      title: 'Swahili & Sheng Sentiment Labeling',
      instructions: 'Analyze customer review statements in Swahili/Sheng and classify their sentiment as Positive, Neutral, or Negative.',
      categoryId: categoryMap['data-annotation'],
      reward: 150.0,
      minPackageTier: 'SILVER',
      durationSeconds: 180,
      totalSlots: 150,
      remainingSlots: 120,
      status: 'ACTIVE',
      dataPayloadJson: JSON.stringify({
        sentences: [
          { text: 'Service yenu ni moto sana! Deliveries zilifika on time kabisa.', options: ['Positive', 'Neutral', 'Negative'] },
          { text: 'Nimepata order ikiwa imechelewa na box imevunjika kidogo.', options: ['Positive', 'Neutral', 'Negative'] }
        ]
      })
    },
    {
      title: 'Local Voice Recording Transcription',
      instructions: 'Listen to a short 15-second audio snippet of an M-Pesa store inquiry and verify the auto-generated transcript.',
      categoryId: categoryMap['data-annotation'],
      reward: 250.0,
      minPackageTier: 'GOLD',
      durationSeconds: 300,
      totalSlots: 100,
      remainingSlots: 75,
      status: 'ACTIVE',
      dataPayloadJson: JSON.stringify({
        audioSnippet: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        draftTranscript: 'Habari, nataka kutuma pesa elfu mbili kwa hii namba ya Till.',
        prompt: 'Correct any spelling or word errors in the transcript.'
      })
    }
  ];

  for (const task of annotationTasks) {
    await prisma.task.create({ data: task });
  }

  // 7. Sample Advertisements
  const advertisements = [
    {
      title: 'Safaricom 5G Home Internet Special Offer',
      advertiser: 'Safaricom Telecommunications',
      mediaUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800',
      targetUrl: 'https://www.safaricom.co.ke',
      durationSeconds: 20,
      reward: 25.0,
      dailyLimit: 10,
      minPackageTier: 'BRONZE',
      status: 'ACTIVE',
    },
    {
      title: 'KCB Bank SME Digital Loans Promo',
      advertiser: 'KCB Group Kenya',
      mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800',
      targetUrl: 'https://kcbgroup.com',
      durationSeconds: 25,
      reward: 35.0,
      dailyLimit: 15,
      minPackageTier: 'SILVER',
      status: 'ACTIVE',
    },
    {
      title: 'Jumia Kenya Super Brands Tech Week',
      advertiser: 'Jumia Online Shopping',
      mediaUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      targetUrl: 'https://www.jumia.co.ke',
      durationSeconds: 30,
      reward: 50.0,
      dailyLimit: 25,
      minPackageTier: 'GOLD',
      status: 'ACTIVE',
    }
  ];

  for (const ad of advertisements) {
    await prisma.advertisement.create({ data: ad });
  }

  // 8. Sample WhatsApp Campaigns
  const whatsappCampaigns = [
    {
      campaignName: 'TaskMint KES 100 Access & Earn Campaign',
      mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      caption: '🚀 Turn your spare time into real digital earnings on TaskMint! Register today and start completing data annotation & microtasks. Join here: https://taskmint.co.ke/register?ref=KAMAU254',
      instructions: 'Download the official TaskMint poster image above, post it to your WhatsApp Status with the provided caption, keep it live for at least 12 hours, and upload a screenshot proof showing view count.',
      reward: 80.0,
      maxParticipants: 100,
      minPackageTier: 'BRONZE',
      status: 'ACTIVE'
    },
    {
      campaignName: 'Nairobi Tech Expo 2026 Promotional Blitz',
      mediaUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      caption: 'Attending Nairobi Tech Summit this August! Early bird tickets are now live. #NairobiTech2026',
      instructions: 'Post the poster image on your status with the hashtag and submit screenshot proof after 6 hours.',
      reward: 120.0,
      maxParticipants: 50,
      minPackageTier: 'SILVER',
      status: 'ACTIVE'
    }
  ];

  for (const campaign of whatsappCampaigns) {
    await prisma.whatsappCampaign.create({ data: campaign });
  }

  console.log('✅ TaskMint Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
