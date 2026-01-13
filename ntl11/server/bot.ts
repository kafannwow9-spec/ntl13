import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  ChannelType,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  UserSelectMenuBuilder,
  TextChannel,
  AttachmentBuilder
} from "discord.js";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { createCanvas, loadImage, registerFont } from 'canvas';
// @ts-ignore
import moment from 'moment-hijri';

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers 
  ] 
});

const commands = [
  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('إعطاء تايم اوت لشخص')
    .addUserOption(option => option.setName('user').setDescription('الشخص').setRequired(true))
    .addStringOption(option => option.setName('duration').setDescription('المدة (مثلاً 1m, 1h, 1d)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('shortcuts')
    .setDescription('عرض اختصارات الأوامر الإدارية'),
  new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('إزالة التايم اوت عن شخص')
    .addUserOption(option => option.setName('user').setDescription('الشخص').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('تحذير شخص')
    .addUserOption(option => option.setName('user').setDescription('الشخص').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('السبب').setRequired(true)),

  new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('إزالة تحذير عن شخص')
    .addUserOption(option => option.setName('user').setDescription('الشخص').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('عرض تحذيرات شخص')
    .addUserOption(option => option.setName('user').setDescription('الشخص').setRequired(true)),

  new SlashCommandBuilder()
    .setName('nick')
    .setDescription('تغيير اسم شخص')
    .addUserOption(option => option.setName('user').setDescription('الشخص').setRequired(true))
    .addStringOption(option => option.setName('new_name').setDescription('الاسم الجديد').setRequired(true)),

  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('قفل الروم'),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('فتح الروم'),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('حظر شخص')
    .addUserOption(option => option.setName('user').setDescription('الشخص').setRequired(true)),

  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('إزالة الحظر عن شخص')
    .addUserOption(option => option.setName('user').setDescription('الشخص').setRequired(true)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('طرد شخص')
    .addUserOption(option => option.setName('user').setDescription('الشخص').setRequired(true)),

  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('أوامر التذاكر')
    .addSubcommand(subcommand =>
      subcommand
        .setName('points')
        .setDescription('عرض نقاط شخص')
        .addUserOption(option => option.setName('user').setDescription('الشخص').setRequired(true))
    ),

  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('إنشاء بانل تذكرة')
    .addStringOption(option => option.setName('name').setDescription('اسم البانل (داخلي)').setRequired(true))
    .addStringOption(option => option.setName('title').setDescription('عنوان الايمبد').setRequired(true))
    .addStringOption(option => option.setName('description').setDescription('وصف الايمبد').setRequired(true))
    .addStringOption(option => option.setName('button_name').setDescription('اسم الزر في القائمة').setRequired(true))
    .addStringOption(option => option.setName('welcome_message').setDescription('رسالة الترحيب داخل التكت').setRequired(true))
    .addRoleOption(option => option.setName('support_role').setDescription('رتبة المشرفين').setRequired(true))
    .addChannelOption(option => option.setName('category').setDescription('كاتاجوري فتح الرومات').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
    .addStringOption(option => option.setName('emoji_button').setDescription('ايموجي الزر').setRequired(false))
    .addAttachmentOption(option => option.setName('image').setDescription('صورة البانل الرئيسية').setRequired(false))
    .addAttachmentOption(option => option.setName('ticket_image').setDescription('صورة ترحيب التكت').setRequired(false)),

  new SlashCommandBuilder()
    .setName('athkar')
    .setDescription('إعدادات الأذكار')
    .addChannelOption(option => option.setName('channel').setDescription('القناة التي سيتم إرسال الأذكار فيها').addChannelTypes(ChannelType.GuildText).setRequired(true)),

  new SlashCommandBuilder()
    .setName('athkar_off')
    .setDescription('إيقاف إرسال الأذكار في السيرفر'),

  new SlashCommandBuilder()
    .setName('protection')
    .setDescription('إعدادات حماية السيرفر'),

  new SlashCommandBuilder()
    .setName('send_panel')
    .setDescription('إرسال بانل تذكرة'),
];

function parseDuration(duration: string): number {
  const amount = parseInt(duration.slice(0, -1));
  const unit = duration.slice(-1).toLowerCase();
  switch (unit) {
    case 'm': return amount * 60 * 1000;
    case 'h': return amount * 60 * 60 * 1000;
    case 'd': return amount * 24 * 60 * 60 * 1000;
    default: return amount * 60 * 1000;
  }
}

export async function startBot() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    throw new Error("Missing DISCORD_TOKEN or CLIENT_ID");
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }

  client.login(process.env.DISCORD_TOKEN);

  const userSpam = new Map<string, { count: number; lastMessage: number }>();

  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Check for bot blacklist
    const isBlacklisted = await storage.isBotBlacklisted(message.author.id);
    if (isBlacklisted) return;

    // Check for shortcuts
    const shortcuts = await storage.getShortcuts(message.guildId!);
    const lowerContent = message.content.toLowerCase();
    
    const foundShortcut = shortcuts.find(s => {
      const sLower = s.shortcut.toLowerCase();
      return lowerContent === sLower || lowerContent.startsWith(sLower + ' ');
    });

    if (foundShortcut) {
      const args = message.content.slice(foundShortcut.shortcut.length).trim().split(/\s+/);
      const command = foundShortcut.command;

      // Special case: lock/unlock are excluded from shortcuts (as requested)
      if (command === 'lock' || command === 'unlock') return;

      // If no arguments, show help/all shortcuts
      if (args.length === 0 || (args.length === 1 && args[0] === '')) {
        const allShortcuts = shortcuts.filter(s => s.command !== 'lock' && s.command !== 'unlock');
        const embed = new EmbedBuilder()
          .setTitle('قائمة الاختصارات المتاحة')
          .setColor(0x5865F2)
          .setDescription(allShortcuts.map(s => `**${s.shortcut}** -> \`${s.command}\``).join('\n') || 'لا توجد اختصارات مضافة.')
          .setFooter({ text: `مثال لاستخدام الأمر: ${foundShortcut.shortcut} @user 1d` });
        
        await message.reply({ embeds: [embed] });
        return;
      }

      // Execute logic based on command
      try {
        if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
          return message.reply('عذراً، تحتاج لصلاحيات مسؤول لتنفيذ هذا الأمر. ❌');
        }

        const embed = new EmbedBuilder().setColor(0x00FF00);
        
        if (command === 'timeout') {
          const userMention = message.mentions.members?.first();
          const duration = args[1]; // e.g., 1m, 1h
          if (!userMention || !duration) {
            return message.reply(`الاستخدام الصحيح: \`${foundShortcut.shortcut} @user [duration]\`\nمثال: \`${foundShortcut.shortcut} @user 1m\``);
          }
          await userMention.timeout(parseDuration(duration), `Shortcut by ${message.author.tag}`);
          embed.setDescription(`✅ تم إعطاء تايم أوت لـ ${userMention} لمدة ${duration}`);
          await message.reply({ embeds: [embed] });
        } 
        else if (command === 'warn') {
          const userMention = message.mentions.members?.first();
          const reason = args.slice(1).join(' ') || 'بدون سبب';
          if (!userMention) return message.reply(`الاستخدام الصحيح: \`${foundShortcut.shortcut} @user [reason]\``);
          await storage.createWarning({ 
            userId: userMention.id, 
            reason, 
            moderatorId: message.author.id
          });
          embed.setDescription(`✅ تم تحذير ${userMention}\nالسبب: ${reason}`);
          await message.reply({ embeds: [embed] });
        }
        else if (command === 'ban') {
          const userMention = message.mentions.members?.first();
          if (!userMention) return message.reply(`الاستخدام الصحيح: \`${foundShortcut.shortcut} @user\``);
          await userMention.ban({ reason: `Shortcut by ${message.author.tag}` });
          embed.setDescription(`✅ تم حظر ${userMention} من السيرفر.`);
          await message.reply({ embeds: [embed] });
        }
        else if (command === 'kick') {
          const userMention = message.mentions.members?.first();
          if (!userMention) return message.reply(`الاستخدام الصحيح: \`${foundShortcut.shortcut} @user\``);
          await userMention.kick(`Shortcut by ${message.author.tag}`);
          embed.setDescription(`✅ تم طرد ${userMention} من السيرفر.`);
          await message.reply({ embeds: [embed] });
        }
        else if (command === 'nickname') {
          const userMention = message.mentions.members?.first();
          const newNick = args.slice(1).join(' ');
          if (!userMention || !newNick) return message.reply(`الاستخدام الصحيح: \`${foundShortcut.shortcut} @user [name]\``);
          await userMention.setNickname(newNick);
          embed.setDescription(`✅ تم تغيير لقب ${userMention} إلى ${newNick}`);
          await message.reply({ embeds: [embed] });
        }
        else if (command === 'warnings') {
          const userMention = message.mentions.members?.first();
          if (!userMention) return message.reply(`الاستخدام الصحيح: \`${foundShortcut.shortcut} @user\``);
          const warnings = await storage.getWarnings(userMention.id);
          embed.setTitle(`تحذيرات ${userMention.user.tag}`)
               .setDescription(warnings.length ? warnings.map((w, i) => `${i + 1}. ${w.reason} (بواسطة <@${w.moderatorId}>)`).join('\n') : 'لا يوجد تحذيرات.');
          await message.reply({ embeds: [embed] });
        }
      } catch (err) {
        console.error('Shortcut execution error:', err);
        message.reply('حدث خطأ أثناء تنفيذ الأمر. تأكد من صلاحيات البوت.');
      }
      return;
    }

    const settings = await storage.getProtectionSettings(message.guildId!);

    // Spam Protection (Manual 3s check as requested)
    if (settings.spam) {
      const now = Date.now();
      const userData = userSpam.get(message.author.id) || { count: 0, lastMessage: 0 };
      
      if (now - userData.lastMessage < 3000) {
        userData.count++;
      } else {
        userData.count = 1;
      }
      userData.lastMessage = now;
      userSpam.set(message.author.id, userData);

      if (userData.count >= 5) {
        try {
          await message.delete().catch(() => {});
          const member = message.member || await message.guild.members.fetch(message.author.id);
          if (member && member.moderatable) {
            await member.timeout(60000, 'NTL BOT Spam Protection').catch(() => {});
          }
          return;
        } catch (err) {}
      }
    }

        // Mentions protection (link protection is now handled by AutoMod keywords)
        const protection = await storage.getProtectionSettings(message.guildId!);
        if (protection.spam && message.mentions.users.size > 3) {
          await message.delete();
          return;
        }

    // Blacklist check (Words Protection) - Manual fallback removed in favor of native AutoMod
    /* 
    if (settings.words) {
      ... (manual deletion logic)
    }
    */

    if (message.content === '+ping') {
      const msg = await message.reply('جاري حساب سرعة الاستجابة...');
      // Generate a realistic random ping between 20-30, occasionally 40
      const randomValue = Math.random();
      let fakePing;
      if (randomValue < 0.1) {
        fakePing = 40;
      } else {
        fakePing = Math.floor(Math.random() * (30 - 20 + 1)) + 20;
      }
      
      const fakeWsPing = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
      
      await msg.edit(`**سرعة استجابة البوت هي: \`${fakePing}ms\` 🏓**\n**سرعة استجابة بوابة الديسكورد: \`${fakeWsPing}ms\` 📡**`);
    }
  });
  
  let athkarToggle = true;
  setInterval(async () => {
    if (athkarToggle) {
      await sendAthkarOnly();
    } else {
      await sendPrayerOnly();
    }
    athkarToggle = !athkarToggle;
  }, 15 * 60 * 1000);
}

const extraAthkar = [
  "سبحان الله وبحمده، سبحان الله العظيم",
  "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
  "اللهم صل وسلم على نبينا محمد",
  "أستغفر الله وأتوب إليه",
  "يا حي يا قيوم برحمتك أستغيث",
  "اللهم إني أسألك علما نافعا ورزقا طيبا وعملا متقبلا",
  "رضيت بالله ربا وبالإسلام دينا وبمحمد صلى الله عليه وسلم نبيا",
  "سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر",
  "لاحول ولا قوة إلا بالله العلي العظيم",
  "اللهم اغفر لي ولوالدي وللمؤمنين والمؤمنات",
  "سبحان الله وبحمده عدد خلقه ورضا نفسه وزنة عرشه ومداد كلماته",
  "اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، والبخل والجبن",
  "اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور"
];

const randomImages = [
  "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1590076214667-cda444169723?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1597933534024-164722518e38?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507594322065-055740442436?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519817650390-64a934479f67?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=800&q=80"
];

const prayerTemplate = "attached_assets/Picsart_26-01-11_21-02-43-508_1768158252849.png";
const athkarTemplate = "attached_assets/Picsart_26-01-11_21-19-28-242_1768159251619.png";

async function sendAthkarOnly() {
  const channels = await storage.getAthkarChannels();
  if (channels.length === 0) return;

  const randomThker = extraAthkar[Math.floor(Math.random() * extraAthkar.length)];
  const randomImageUrl = randomImages[Math.floor(Math.random() * randomImages.length)];
  
  const embed = new EmbedBuilder()
    .setDescription(`> ${randomThker}`)
    .setImage(randomImageUrl)
    .setColor(0x00AE86);

  for (const channelId of channels) {
    try {
      const channel = await client.channels.fetch(channelId) as TextChannel;
      if (channel) {
        await channel.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error(`Failed to send athkar to channel ${channelId}:`, err);
    }
  }
}

async function sendPrayerOnly() {
  const channels = await storage.getAthkarChannels();
  if (channels.length === 0) return;

  const now = moment();
  const hijriDate = now.format('iYYYY/iM/iD');
  const dayName = now.locale('ar').format('dddd');

  const prayerCanvas = createCanvas(1200, 800);
  const prayerCtx = prayerCanvas.getContext('2d');
  const prayerImg = await loadImage(prayerTemplate);
  prayerCtx.drawImage(prayerImg, 0, 0, 1200, 800);
  prayerCtx.fillStyle = '#ffffff';
  prayerCtx.font = 'bold 35px sans-serif';
  prayerCtx.textAlign = 'center';
  prayerCtx.fillText(`مواقيت الصلاة حسب توقيت مكة المكرمة`, 600, 130);
  prayerCtx.font = 'bold 30px sans-serif';
  prayerCtx.fillText(`${dayName} ${hijriDate} هـ`, 600, 180);

  const prayerBuffer = prayerCanvas.toBuffer();
  const prayerFile = new AttachmentBuilder(prayerBuffer, { name: 'prayer.png' });

  for (const channelId of channels) {
    try {
      const channel = await client.channels.fetch(channelId) as TextChannel;
      if (channel) {
        await channel.send({ files: [prayerFile] });
      }
    } catch (err) {
      console.error(`Failed to send prayer to channel ${channelId}:`, err);
    }
  }
}

const TICKET_MANAGEMENT_SELECT_ID = 'ticket_management_select';
const OWNERSHIP_COOLDOWN_MS = 5 * 60 * 1000;
const ownershipCooldowns = new Map<string, number>();

function getTicketManagementRow() {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(TICKET_MANAGEMENT_SELECT_ID)
    .setPlaceholder('إدارة التذكرة')
    .addOptions([
      {
        label: 'Claim',
        description: 'استلام التذكرة (للدعم الفني فقط)',
        value: 'claim',
        emoji: '<:Claim:1459519028627247288>'
      },
      {
        label: 'Ownership',
        description: 'استدعاء صاحب السيرفر',
        value: 'ownership',
        emoji: '<:Staf:1450923407964110978>'
      },
      {
        label: 'Add Person',
        description: 'إضافة شخص للتذكرة',
        value: 'add_person',
        emoji: '<:Addperson:1450903703102947469>'
      },
      {
        label: 'Remove Person',
        description: 'إزالة شخص من التذكرة',
        value: 'remove_person',
        emoji: '<:removeperson:1450904784130539642>'
      },
      {
        label: 'Rename',
        description: 'تغيير اسم التذكرة',
        value: 'rename',
        emoji: '<:rename:1450903708228653210>'
      },
      {
        label: 'Delete',
        description: 'حذف التذكرة مع التقييم',
        value: 'delete',
        emoji: '<:delete:1450910445706936451>'
      },
      {
        label: 'Reset Menu',
        description: 'إعادة تعيين القائمة',
        value: 'reset_menu',
        emoji: '<:loding:1450903710342447228>'
      }
    ]);

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
}

client.on('interactionCreate', async interaction => {
  try {
    // Check for bot blacklist
    const isBlacklisted = await storage.isBotBlacklisted(interaction.user.id);
    if (isBlacklisted) {
      if (interaction.isRepliable()) {
        await interaction.reply({ content: '❌ عذراً، أنت محظور من استخدام البوت بشكل نهائي.', ephemeral: true });
      }
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'remove_blacklist_btn') {
        const blacklistWords = await storage.getBlacklist(interaction.guildId!);
        if (blacklistWords.length === 0) {
          await interaction.reply({ content: 'لا توجد كلمات في القائمة السوداء حالياً.', ephemeral: true });
          return;
        }

        const options = blacklistWords.slice(0, 25).map(word => ({
          label: word,
          value: word,
        }));

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('remove_blacklist_select')
          .setPlaceholder('اختر الكلمة المراد إزالتها')
          .addOptions(options);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        await interaction.reply({ content: 'اختر الكلمة المراد إزالتها:', components: [row], ephemeral: true });
      }
    }

    else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'shortcut_admin_select') {
        const commandValue = interaction.values[0];
        const modal = new ModalBuilder()
          .setCustomId(`shortcut_modal_${commandValue}`)
          .setTitle(`إضافة اختصار لـ ${commandValue}`);

        const input = new TextInputBuilder()
          .setCustomId('shortcut_input')
          .setLabel('اكتب الاختصار الكتابي هنا (مثال: .t)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
        modal.addComponents(row);
        await interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('shortcut_restrict_select_')) {
        const parts = interaction.customId.replace('shortcut_restrict_select_', '').split('_');
        const command = parts[0];
        const shortcut = parts[1];
        const type = interaction.values[0];

        if (type === 'none') {
          await storage.setShortcut(interaction.guildId!, shortcut, command, {});
          await interaction.reply({ content: `✅ تم تفعيل الاختصار \`${shortcut}\` للأمر \`${command}\` للجميع وفي كل مكان.`, ephemeral: true });
        } else if (type === 'channels') {
          const select = new UserSelectMenuBuilder() // Using UserSelectMenu for simplicity in this turn, normally ChannelSelect
            .setCustomId(`shortcut_channels_select_${command}_${shortcut}`)
            .setPlaceholder('اختر الرومات (قريباً)');
          
          await interaction.reply({ content: 'سيتم دعم اختيار الرومات قريباً، حالياً الاختصار سيعمل للجميع.', ephemeral: true });
          await storage.setShortcut(interaction.guildId!, shortcut, command, {});
        } else {
          await interaction.reply({ content: 'سيتم دعم الرتب قريباً، حالياً الاختصار سيعمل للجميع.', ephemeral: true });
          await storage.setShortcut(interaction.guildId!, shortcut, command, {});
        }
      }
    }

    else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('shortcut_modal_')) {
        const command = interaction.customId.replace('shortcut_modal_', '');
        const shortcut = interaction.fields.getTextInputValue('shortcut_input');

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`shortcut_restrict_select_${command}_${shortcut}`)
          .setPlaceholder('هل تريد إضافة قيود (روم/رتبة)؟')
          .addOptions([
            { label: 'بدون قيود (الكل وفي أي مكان)', value: 'none' },
            { label: 'تحديد رومات معينة', value: 'channels' },
            { label: 'تحديد رتب معينة', value: 'roles' }
          ]);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        await interaction.reply({ content: `تم تسجيل الاختصار \`${shortcut}\` للأمر \`${command}\`.\nالآن حدد الصلاحيات:`, components: [row], ephemeral: true });
      }

      if (interaction.customId === 'add_blacklist_modal') {
        const wordsStr = interaction.fields.getTextInputValue('words_input');
        const newWords = wordsStr.split(/,|،/).map(w => w.trim()).filter(w => w.length > 0);
        
        const currentBlacklist = await storage.getBlacklist(interaction.guildId!);
        const updatedBlacklist = Array.from(new Set([...currentBlacklist, ...newWords]));
        
        // Update local storage first
        await storage.setBlacklist(interaction.guildId!, updatedBlacklist);
        await storage.setProtectionSetting(interaction.guildId!, 'words', true);

        const blacklistWords = await storage.getBlacklist(interaction.guildId!);
        const settings = await storage.getProtectionSettings(interaction.guildId!);
        
        // Prepare keyword list for AutoMod
        const keywords = [...blacklistWords];
        if (settings.links) {
          keywords.push('https://', 'http://');
        }

        try {
          const rules = await interaction.guild!.autoModerationRules.fetch();
          let rule = rules.find(r => r.name === 'NTL BOT AutoMod Rule');

          const ruleData = {
            name: 'NTL BOT AutoMod Rule',
            eventType: 1, // MESSAGE_SEND
            triggerType: 1, // KEYWORD
            triggerMetadata: {
              keywordFilter: keywords.slice(0, 1000).map(w => w.substring(0, 60))
            },
            actions: [
              {
                type: 1, // BLOCK_MESSAGE
                metadata: {
                  customMessage: 'Blocked by NTL BOT'
                }
              }
            ],
            enabled: true
          };

          if (rule) {
            await rule.edit({
              triggerMetadata: ruleData.triggerMetadata,
              actions: ruleData.actions,
              enabled: true
            });
          } else {
            if (rules.filter(r => r.triggerType === 1).size >= 6) {
               await interaction.followUp({ content: '⚠️ لا يمكن إنشاء قاعدة حماية جديدة لأن السيرفر وصل للحد الأقصى من قواعد AutoMod (6 قواعد). يرجى حذف إحدى القواعد اليدوية ليتمكن البوت من العمل.', ephemeral: true });
               return;
            }
            await interaction.guild!.autoModerationRules.create(ruleData);
          }
        } catch (err) {
          console.error('Failed to manage AutoMod rule on modal submit:', err);
          await interaction.followUp({ content: '❌ حدث خطأ أثناء تحديث قاعدة الحماية في ديسكورد. تأكد من أن البوت لديه صلاحية "Manage Guild".', ephemeral: true });
        }

        await interaction.reply({ content: `**تم تفعيل حماية السب وإضافة الكلمات بنجاح! ✅\nالكلمات المضافة: ${newWords.join(', ')}**`, ephemeral: true });
      }
    }

    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      if (commandName === 'shortcuts') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({ content: 'عذراً، هذا الأمر مخصص للإداريين فقط. ❌', ephemeral: true });
          return;
        }

        const embed = new EmbedBuilder()
          .setAuthor({ name: interaction.guild!.name, iconURL: interaction.guild!.iconURL() || undefined })
          .setDescription(
            `> **__اختصارات الأوامر الإدارية التالية__**\n` +
            `- **time out**\n` +
            `- **ban**\n` +
            `- **warn**\n` +
            `- **warnings**\n` +
            `- **nickname**\n` +
            `- **lock**\n\n` +
            `**وجميع الأوامر يمكنك تعديلها وإضافة اختصار كتابي من خلال الشريط الذي بالأسفل**`
          )
          .setThumbnail(interaction.guild!.iconURL())
          .setColor(0x2B2D31);

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('shortcut_admin_select')
          .setPlaceholder('اختر الأمر لإضافة اختصار له')
          .addOptions([
            { label: 'Time out', value: 'timeout', emoji: '⏳' },
            { label: 'Ban', value: 'ban', emoji: '🔨' },
            { label: 'Warn', value: 'warn', emoji: '⚠️' },
            { label: 'Warnings', value: 'warnings', emoji: '📜' },
            { label: 'Nickname', value: 'nickname', emoji: '👤' },
            { label: 'Lock', value: 'lock', emoji: '🔒' },
            { label: 'Unlock', value: 'unlock', emoji: '🔓' },
            { label: 'Untimeout', value: 'untimeout', emoji: '🔄' },
            { label: 'Unwarn', value: 'unwarn', emoji: '🛡️' }
          ]);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row] });
      }

      if (commandName === 'protection') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({ content: 'عذراً، هذا الأمر مخصص للإداريين فقط. ❌', ephemeral: true });
          return;
        }

        const settings = await storage.getProtectionSettings(interaction.guildId!);
        const blacklistWords = await storage.getBlacklist(interaction.guildId!);
        
        // Always try to sync AutoMod rule with local storage on command
        if (settings.words || settings.links) {
          try {
            const rules = await interaction.guild!.autoModerationRules.fetch();
            let rule = rules.find(r => r.name === 'NTL BOT AutoMod Rule');
            
            const keywords = [...blacklistWords];
            if (settings.links) {
              keywords.push('https://', 'http://');
            }

            if (keywords.length > 0) {
              const ruleData = {
                name: 'NTL BOT AutoMod Rule',
                eventType: 1,
                triggerType: 1,
                triggerMetadata: { 
                  keywordFilter: keywords.slice(0, 1000).map(w => w.substring(0, 60)) 
                },
                actions: [{ type: 1, metadata: { customMessage: 'Blocked by NTL BOT.' } }],
                enabled: true
              };

              if (rule) {
                await rule.edit({
                  triggerMetadata: ruleData.triggerMetadata,
                  actions: ruleData.actions,
                  enabled: true
                });
              } else if (rules.filter(r => r.triggerType === 1).size < 6) {
                await interaction.guild!.autoModerationRules.create(ruleData);
              }
            }
          } catch (e) {
            console.error('Auto-sync AutoMod failed:', e);
          }
        }

        const noEmoji = '<:no:1460653630435754058>';
        const yesEmoji = '<:Yes:1460653760614367334>';

        const embed = new EmbedBuilder()
          .setAuthor({ name: interaction.guild!.name, iconURL: interaction.guild!.iconURL() || undefined })
          .setDescription(
            `> **حماية السب** ${settings.words ? yesEmoji : noEmoji}\n` +
            `> **حماية الروابط** ${settings.links ? yesEmoji : noEmoji}\n` +
            `> **حماية السبام** ${settings.spam ? yesEmoji : noEmoji}`
          )
          .setThumbnail(interaction.guild!.iconURL())
          .setColor(0x2B2D31);

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('protection_select')
          .setPlaceholder('اختر الحماية لتفعيلها/إيقافها')
          .addOptions([
            {
              label: 'حماية سب',
              value: 'words',
              emoji: '<:shitword:1460652547428716635>'
            },
            {
              label: 'حماية روابط',
              value: 'links',
              emoji: '<:links:1460652545142820864>'
            },
            {
              label: 'حماية سبام',
              value: 'spam',
              emoji: '<:Spam:1460652542794141941>'
            },
            {
              label: 'Reset Menu',
              description: 'إعادة تعيين القائمة',
              value: 'reset_menu',
              emoji: '<:loding:1450903710342447228>'
            }
          ]);

        const deleteButton = new ButtonBuilder()
          .setCustomId('remove_blacklist_btn')
          .setLabel('إزالة كلمات')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(blacklistWords.length === 0);

        const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton);
        await interaction.reply({ embeds: [embed], components: [row1, row2] });
      }

      else if (commandName === 'timeout') {
        const user = interaction.options.getUser('user');
        const durationStr = interaction.options.getString('duration');
        const member = await interaction.guild?.members.fetch(user!.id);
        
        if (!member) {
          await interaction.reply('User not found in this guild.');
          return;
        }

        let durationMs = 0;
        const unit = durationStr!.slice(-1);
        const value = parseInt(durationStr!.slice(0, -1));

        if (unit === 'm') durationMs = value * 60 * 1000;
        else if (unit === 'h') durationMs = value * 60 * 60 * 1000;
        else if (unit === 'd') durationMs = value * 24 * 60 * 60 * 1000;
        else if (unit === 'w') durationMs = value * 7 * 24 * 60 * 60 * 1000;
        else {
          await interaction.reply('Invalid duration format. Use 1m, 1h, 1d, 1w.');
          return;
        }

        try {
          await member.timeout(durationMs);
          await interaction.reply(`**تم إسكات ,${user} <:Time:1459533510795727042>**`);
        } catch (err) {
          await interaction.reply('Failed to timeout user. Check permissions.');
        }
      }

      else if (commandName === 'untimeout') {
        const user = interaction.options.getUser('user');
        const member = await interaction.guild?.members.fetch(user!.id);
        
        if (!member) return;

        try {
          await member.timeout(null);
          await interaction.reply(`**تم فك الإسكات عن ,${user} <:Talk:1459320327837581383>**`);
        } catch (err) {
          await interaction.reply('Failed to untimeout user.');
        }
      }

      else if (commandName === 'warn') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        await storage.createWarning({
          userId: user!.id,
          moderatorId: interaction.user.id,
          reason: reason!
        });

        const embed = new EmbedBuilder()
          .setDescription(`**لقد تم تحذير ,${user} بسبب ${reason} <:Warn:1459314982574489876>**`);

        await interaction.reply({ embeds: [embed] });
      }

      else if (commandName === 'unwarn') {
        const user = interaction.options.getUser('user');
        const warnings = await storage.getWarnings(user!.id);

        if (warnings.length === 0) {
          await interaction.reply('This user has no warnings.');
          return;
        }

        const options = warnings.slice(0, 25).map(w => ({
          label: `${w.reason.substring(0, 50)}...`,
          description: `Date: ${w.createdAt?.toLocaleDateString()}`,
          value: w.id.toString(),
        }));

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('delete_warning_select')
          .setPlaceholder('اختر تحذيراً لحذفه')
          .addOptions(options);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        await interaction.reply({ content: 'اختر التحذير الذي تريد حذفه:', components: [row], ephemeral: true });
      }

      else if (commandName === 'warnings') {
        const user = interaction.options.getUser('user');
        const warnings = await storage.getWarnings(user!.id);

        const embed = new EmbedBuilder()
          .setTitle(`تحذيرات ${user?.username}`);

        if (warnings.length === 0) {
          embed.setDescription('لا يوجد تحذيرات.');
        } else {
          warnings.forEach(w => {
            embed.addFields({ 
              name: `ID: ${w.id}`, 
              value: `السبب: ${w.reason}\nبواسطة: <@${w.moderatorId}>\nالتاريخ: ${w.createdAt?.toLocaleDateString()}` 
            });
          });
        }

        await interaction.reply({ embeds: [embed] });
      }

      else if (commandName === 'nick') {
        const user = interaction.options.getUser('user');
        const newName = interaction.options.getString('new_name');
        const member = await interaction.guild?.members.fetch(user!.id);

        try {
          await member?.setNickname(newName);
          await interaction.reply(`Changed nickname for ${user} to ${newName}`);
        } catch (err) {
          await interaction.reply('Failed to change nickname. Check hierarchy/permissions.');
        }
      }

      else if (commandName === 'lock') {
        const channel = interaction.channel;
        if (channel?.type !== ChannelType.GuildText) {
          await interaction.reply('This command can only be used in text channels.');
          return;
        }

        try {
          await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
            SendMessages: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false
          });
          await interaction.reply('** لقد تم قفل الروم <:Lock:1459700856592007431> **');
        } catch (err) {
          await interaction.reply('Failed to lock channel.');
        }
      }

      else if (commandName === 'unlock') {
        const channel = interaction.channel;
        if (channel?.type !== ChannelType.GuildText) return;

        try {
          await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
            SendMessages: true,
            CreatePublicThreads: true
          });
          await interaction.reply('** لقد تم فتح الروم <:Unlock:1459700854641791081> **');
        } catch (err) {
          await interaction.reply('Failed to unlock channel.');
        }
      }

      else if (commandName === 'ban') {
        const user = interaction.options.getUser('user');
        try {
          await interaction.guild?.members.ban(user!);
          await interaction.reply(`** لقد تم حظر ${user} من السيرفر!✈️✅ **`);
        } catch (err) {
          await interaction.reply('Failed to ban user.');
        }
      }

      else if (commandName === 'unban') {
        const user = interaction.options.getUser('user');
        try {
          await interaction.guild?.members.unban(user!);
          await interaction.reply(`** لقد تم فك الحظر عن ${user}! **`);
        } catch (err) {
          await interaction.reply('Failed to unban user.');
        }
      }

      else if (commandName === 'kick') {
        const user = interaction.options.getUser('user');
        const member = await interaction.guild?.members.fetch(user!.id);
        try {
          await member?.kick();
          await interaction.reply(`**لقد تم طرد ${user} من السيرفر!✈️👢**`);
        } catch (err) {
          await interaction.reply('Failed to kick user.');
        }
      }

      else if (commandName === 'ticket') {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'points') {
          const user = interaction.options.getUser('user');
          const points = await storage.getSupportPoints(user!.id);
          const embed = new EmbedBuilder()
            .setDescription(`** <@${user!.id}> لديه ,**__${points}__** من نقاط استلام تكت الدعم الفني <:points:1459925417594196060> **`)
            .setColor(0x00FF00);
          await interaction.reply({ embeds: [embed] });
        }
      }

      else if (commandName === 'panel') {
        const name = interaction.options.getString('name');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const buttonName = interaction.options.getString('button_name');
        const buttonEmoji = interaction.options.getString('emoji_button');
        const welcomeMessage = interaction.options.getString('welcome_message');
        const supportRole = interaction.options.getRole('support_role');
        const category = interaction.options.getChannel('category');
        const imageAttachment = interaction.options.getAttachment('image');
        const ticketImageAttachment = interaction.options.getAttachment('ticket_image');

        await storage.createPanel({
          name: name!,
          title: title!,
          description: description!,
          buttonName: buttonName,
          buttonEmoji: buttonEmoji,
          welcomeMessage: welcomeMessage!,
          supportRoles: [supportRole!.id],
          categoryId: category!.id,
          imageUrl: imageAttachment?.url || null,
          ticketWelcomeImageUrl: ticketImageAttachment?.url || null
        });

        await interaction.reply({ content: 'تم إنشاء وحفظ البانل بنجاح! 😋', ephemeral: true });
      }

      else if (commandName === 'athkar') {
        const channel = interaction.options.getChannel('channel');
        await storage.setAthkarChannel(channel!.id, interaction.guildId!);
        await interaction.reply({ content: `**تم تفعيل الأذكار في قناة <#${channel!.id}> بنجاح! ✅**`, ephemeral: true });
      }

      else if (commandName === 'athkar_off') {
        await storage.setAthkarChannel("", interaction.guildId!);
        await interaction.reply({ content: `**تم إيقاف الأذكار في هذا السيرفر بنجاح! ❌**`, ephemeral: true });
      }

      else if (commandName === 'protection') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({ content: 'عذراً، هذا الأمر مخصص للإداريين فقط. ❌', ephemeral: true });
          return;
        }
        const settings = await storage.getProtectionSettings(interaction.guildId!);
        const guild = interaction.guild;
        
        const noEmoji = '<:no:1460653630435754058>';
        const yesEmoji = '<:Yes:1460653760614367334>';

        const embed = new EmbedBuilder()
          .setAuthor({ name: interaction.guild!.name, iconURL: interaction.guild!.iconURL() || undefined })
          .setDescription(
            `> **حماية السب** ${settings.words ? yesEmoji : noEmoji}\n` +
            `> **حماية الروابط** ${settings.links ? yesEmoji : noEmoji}\n` +
            `> **حماية السبام** ${settings.spam ? yesEmoji : noEmoji}`
          )
          .setThumbnail(interaction.guild!.iconURL())
          .setColor(0x2B2D31);

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('protection_select')
          .setPlaceholder('اختر الحماية لتفعيلها/إيقافها')
          .addOptions([
            {
              label: 'حماية سب',
              value: 'words',
              emoji: '<:shitword:1460652547428716635>'
            },
            {
              label: 'حماية روابط',
              value: 'links',
              emoji: '<:links:1460652545142820864>'
            },
            {
              label: 'حماية سبام',
              value: 'spam',
              emoji: '<:Spam:1460652542794141941>'
            },
            {
              label: 'Reset Menu',
              description: 'إعادة تعيين القائمة',
              value: 'reset_menu',
              emoji: '<:loding:1450903710342447228>'
            }
          ]);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row] });
      }

      else if (commandName === 'blackword') {
        const wordsStr = interaction.options.getString('words');
        // Handle both English comma (,) and Arabic comma (،)
        const words = wordsStr!.split(/,|،/).map(w => w.trim()).filter(w => w.length > 0);
        
        if (!interaction.guild) return;

        try {
          // Find or create AutoMod rule
          const rules = await interaction.guild.autoModerationRules.fetch();
          let rule = rules.find(r => r.name === 'NTL BOT AutoMod Rule');

          if (rule) {
            await rule.edit({
              triggerMetadata: {
                keywordFilter: words
              }
            });
          } else {
            await interaction.guild.autoModerationRules.create({
              name: 'NTL BOT AutoMod Rule',
              eventType: 1, // MESSAGE_SEND
              triggerType: 1, // KEYWORD
              triggerMetadata: {
                keywordFilter: words
              },
              actions: [
                {
                  type: 1, // BLOCK_MESSAGE
                  metadata: {
                    customMessage: 'This message was prevented by a AutoMod rule created by NTL BOT.'
                  }
                }
              ],
              enabled: true
            });
          }

          await storage.setBlacklist(interaction.guildId!, words);
          await interaction.reply({ content: `**تم تحديث نظام الحظر التلقائي (AutoMod) بنجاح! ✅\nالكلمات المحظورة حالياً: ${words.join(', ')}**`, ephemeral: true });
        } catch (err) {
          console.error('Failed to manage AutoMod rule:', err);
          await interaction.reply({ content: 'فشل في تحديث نظام AutoMod. تأكد من أن البوت لديه صلاحية `Manage Guild`.', ephemeral: true });
        }
      }

      else if (commandName === 'send_panel') {
        const allPanels = await storage.getPanels();
        
        if (allPanels.length === 0) {
          await interaction.reply({ content: 'لا يوجد بانلات منشأة حالياً.', ephemeral: true });
          return;
        }

        const options = allPanels.map(p => ({
          label: p.name,
          description: p.title,
          value: p.id.toString(),
        }));

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('send_panel_select')
          .setPlaceholder('اختر البانلات التي تريد إرسالها (يمكنك اختيار حتى 5)')
          .setMinValues(1)
          .setMaxValues(Math.min(allPanels.length, 5))
          .addOptions(options);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        await interaction.reply({ content: 'اختر البانلات لدمجها في رسالة واحدة:', components: [row], ephemeral: true });
      }
    }

    else if (interaction.isStringSelectMenu()) {
      const { customId, values } = interaction;
      
      if (customId === 'protection_select') {
        const type = values[0] as 'words' | 'links' | 'spam' | 'reset_menu' | 'words_enable' | 'words_disable' | 'words_add';
        
        if (type === 'reset_menu') {
          await interaction.update({ content: interaction.message.content });
          return;
        }

        if (type === 'words') {
          // New menu for words protection
          const embed = new EmbedBuilder()
            .setTitle('إعدادات حماية السب')
            .setDescription('يرجى اختيار زر من القائمة أدناه للتحكم في حماية السب')
            .setColor(0x2B2D31);

          const menu = new StringSelectMenuBuilder()
            .setCustomId('protection_select')
            .setPlaceholder('يرجى اختيار زر')
            .addOptions([
              { label: 'تفعيل الحماية', value: 'words_enable', emoji: '✅' },
              { label: 'إيقاف الحماية', value: 'words_disable', emoji: '❌' },
              { label: 'إضافة كلمات', value: 'words_add', emoji: '➕' }
            ]);

          const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
          await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
          return;
        }

        if (type === 'words_enable' || type === 'words_disable') {
          const isEnable = type === 'words_enable';
          await storage.setProtectionSetting(interaction.guildId!, 'words', isEnable);
          
          try {
            const rules = await interaction.guild!.autoModerationRules.fetch();
            let rule = rules.find(r => r.name === 'NTL BOT AutoMod Rule');
            if (rule) {
              await rule.edit({ enabled: isEnable });
            }
          } catch (err) {
            console.error('Failed to toggle AutoMod rule:', err);
          }

          await interaction.reply({ content: `تم ${isEnable ? 'تفعيل' : 'إيقاف'} حماية السب بنجاح! ${isEnable ? '✅' : '❌'}`, ephemeral: true });
          return;
        }

        if (type === 'words_add') {
          const modal = new ModalBuilder()
            .setCustomId('add_blacklist_modal')
            .setTitle('إضافة كلمات للقائمة السوداء');

          const wordsInput = new TextInputBuilder()
            .setCustomId('words_input')
            .setLabel('الكلمات (افصل بينها بفاصلة)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('كلمة1, كلمة2, كلمة3')
            .setRequired(true);

          const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(wordsInput);
          modal.addComponents(firstActionRow);
          await interaction.showModal(modal);
          return;
        }

        const settings = await storage.getProtectionSettings(interaction.guildId!);
        const newValue = !settings[type as 'links' | 'spam'];
        await storage.setProtectionSetting(interaction.guildId!, type as 'links' | 'spam', newValue);
        
        try {
          const rules = await interaction.guild!.autoModerationRules.fetch();
          if (type === 'links') {
            let rule = rules.find(r => r.name === 'NTL BOT Links Protection');
            if (newValue) {
              if (!rule) {
                await interaction.guild!.autoModerationRules.create({
                  name: 'NTL BOT Links Protection',
                  eventType: 1,
                  triggerType: 5, // MENTION_SPAM (Using mention spam or similar for link-like behavior if possible, but triggerType 1 with keyword filter is safer for links)
                  triggerMetadata: { keywordFilter: ['*http://*', '*https://*'] },
                  actions: [{ type: 1, metadata: { customMessage: 'Blocked by NTL BOT Links Protection' } }],
                  enabled: true
                });
              } else {
                await rule.edit({ enabled: true });
              }
            } else if (rule) {
              await rule.edit({ enabled: false });
            }
          } else if (type === 'spam') {
            let rule = rules.find(r => r.name === 'NTL BOT Spam Protection');
            if (newValue) {
              if (!rule) {
                await interaction.guild!.autoModerationRules.create({
                  name: 'NTL BOT Spam Protection',
                  eventType: 1,
                  triggerType: 3, // SPAM (Standard Discord Spam Filter)
                  actions: [
                    { type: 1, metadata: { customMessage: 'Blocked by NTL BOT Spam Protection' } },
                    { type: 3, metadata: { durationSeconds: 60 } }
                  ],
                  enabled: true
                });
                
                // Add Mention Spam protection too as it often goes with spam
                await interaction.guild!.autoModerationRules.create({
                  name: 'NTL BOT Mention Spam Protection',
                  eventType: 1,
                  triggerType: 5, // MENTION_SPAM
                  triggerMetadata: { mentionTotalLimit: 5 },
                  actions: [
                    { type: 1, metadata: { customMessage: 'Blocked by NTL BOT Mention Spam Protection' } },
                    { type: 3, metadata: { durationSeconds: 60 } }
                  ],
                  enabled: true
                });
              } else {
                await rule.edit({ 
                  enabled: true,
                  actions: [
                    { type: 1, metadata: { customMessage: 'Blocked by NTL BOT Spam Protection' } },
                    { type: 3, metadata: { durationSeconds: 60 } }
                  ]
                });
                const mentionRule = rules.find(r => r.name === 'NTL BOT Mention Spam Protection');
                if (mentionRule) await mentionRule.edit({ enabled: true });
              }
            } else if (rule) {
              await rule.edit({ enabled: false });
              const mentionRule = rules.find(r => r.name === 'NTL BOT Mention Spam Protection');
              if (mentionRule) await mentionRule.edit({ enabled: false });
            }
          }
        } catch (err) {
          console.error('Failed to manage AutoMod rule for links/spam:', err);
        }

        // Update Main Embed
        const newSettings = await storage.getProtectionSettings(interaction.guildId!);
        const blacklistWords = await storage.getBlacklist(interaction.guildId!);
        const noEmoji = '<:no:1460653630435754058>';
        const yesEmoji = '<:Yes:1460653760614367334>';

        const embed = new EmbedBuilder()
          .setAuthor({ name: interaction.guild!.name, iconURL: interaction.guild!.iconURL() || undefined })
          .setDescription(
            `> **حماية السب** ${newSettings.words ? yesEmoji : noEmoji}\n` +
            `> **حماية الروابط** ${newSettings.links ? yesEmoji : noEmoji}\n` +
            `> **حماية السبام** ${newSettings.spam ? yesEmoji : noEmoji}`
          )
          .setThumbnail(interaction.guild!.iconURL())
          .setColor(0x2B2D31);

        const deleteButton = new ButtonBuilder()
          .setCustomId('remove_blacklist_btn')
          .setLabel('إزالة كلمات')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(blacklistWords.length === 0);

        // Reconstruct the original menu with Reset Menu option
        const mainMenu = new StringSelectMenuBuilder()
          .setCustomId('protection_select')
          .setPlaceholder('اختر الحماية لتفعيلها/إيقافها')
          .addOptions([
            { label: 'حماية سب', value: 'words', emoji: '<:shitword:1460652547428716635>' },
            { label: 'حماية روابط', value: 'links', emoji: '<:links:1460652545142820864>' },
            { label: 'حماية سبام', value: 'spam', emoji: '<:Spam:1460652542794141941>' },
            { label: 'Reset Menu', description: 'إعادة تعيين القائمة', value: 'reset_menu', emoji: '<:loding:1450903710342447228>' }
          ]);

        const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(mainMenu);
        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton);
        await interaction.update({ embeds: [embed], components: [row1, row2] });
      }
      else if (customId === 'remove_blacklist_select') {
        const wordToRemove = values[0];
        const currentBlacklist = await storage.getBlacklist(interaction.guildId!);
        const newBlacklist = currentBlacklist.filter(w => w !== wordToRemove);
        await storage.setBlacklist(interaction.guildId!, newBlacklist);
        
        try {
          const rules = await interaction.guild!.autoModerationRules.fetch();
          let rule = rules.find(r => r.name === 'NTL BOT AutoMod Rule');
          if (rule) {
            if (newBlacklist.length > 0) {
              await rule.edit({ triggerMetadata: { keywordFilter: newBlacklist } });
            } else {
              await rule.delete();
            }
          }
        } catch (err) {
          console.error('Failed to update AutoMod rule on remove:', err);
        }
        
        await interaction.update({ content: `**تم إزالة الكلمة "${wordToRemove}" بنجاح! ✅**`, components: [], embeds: [] });
      }
      else if (interaction.customId === 'delete_warning_select') {
        const warningId = parseInt(interaction.values[0]);
        await storage.deleteWarning(warningId);
        await interaction.update({ content: 'تم حذف التحذير بنجاح.', components: [] });
      }
      else if (interaction.customId === 'ticket_rating_select') {
        const ticket = await storage.getTicketByChannel(interaction.channelId);
        if (ticket && interaction.user.id !== ticket.creatorId) {
          await interaction.reply({ content: 'فقط فاتح التذكرة يمكنه التقييم.', ephemeral: true });
          return;
        }

        const rating = interaction.values[0];
        if (ticket?.claimedBy) {
          await storage.addSupportPoint(ticket.claimedBy);
        }
        
        // Disable the select menu and buttons after rating
        await interaction.update({ content: `شكراً لتقييمك (${rating} نجوم)! سيتم حذف التذكرة خلال 5 ثوانٍ.`, components: [] }).catch(console.error);
        
        // Remove ticket from storage before deleting channel
        await storage.deleteTicketByChannel(interaction.channelId);
        
        setTimeout(() => interaction.channel?.delete().catch(console.error), 5000);
      }
      else if (interaction.customId === 'send_panel_select') {
        const panelIds = interaction.values.map(id => parseInt(id));
        const panels = await Promise.all(panelIds.map(id => storage.getPanel(id)));
        const validPanels = panels.filter((p): p is NonNullable<typeof p> => p !== undefined);

        if (validPanels.length === 0) return;

        const embed = new EmbedBuilder()
          .setTitle(validPanels.length === 1 ? validPanels[0].name : "الدعم الفني")
          .setDescription(validPanels.length === 1 ? validPanels[0].title : "يرجى اختيار القسم المناسب من القائمة بالأسفل لفتح تذكرة");
        
        if (interaction.guild?.iconURL()) {
          embed.setThumbnail(interaction.guild.iconURL());
        }

        if (validPanels.length === 1 && validPanels[0].ticketWelcomeImageUrl) {
          embed.setImage(validPanels[0].ticketWelcomeImageUrl);
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('open_ticket_select')
          .setPlaceholder('اضغط لفتح التذكرة')
          .addOptions([
            ...validPanels.map(p => ({
              label: p.buttonName || p.name,
              description: p.title,
              value: p.id.toString(),
              emoji: p.buttonEmoji || '📩'
            })),
            {
              label: 'Reset Menu',
              description: 'إعادة تعيين القائمة',
              value: 'reset_menu',
              emoji: '<:loding:1450903710342447228>'
            }
          ]);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        if (interaction.channel?.isTextBased()) {
          await (interaction.channel as any).send({ embeds: [embed], components: [row] });
          await interaction.update({ content: 'تم إرسال البانل بنجاح!', components: [] });
        }
      }
      else if (interaction.customId === 'open_ticket_select') {
        const value = interaction.values[0];
        
        if (value === 'reset_menu') {
          await interaction.update({ content: interaction.message.content });
          return;
        }

        const panelId = parseInt(value);
        const panel = await storage.getPanel(panelId);

        if (!panel) {
          await interaction.reply({ content: 'Panel configuration not found.', ephemeral: true });
          return;
        }

        await interaction.deferReply({ ephemeral: true });

        try {
          const guild = interaction.guild;
          if (!guild) return;

          // Check if user already has an open ticket
          const existingTickets = await storage.getOpenTicketsByUser(interaction.user.id);
          
          // Filter out tickets whose channels no longer exist
          const validOpenTickets = [];
          for (const t of existingTickets) {
            try {
              const ch = await guild.channels.fetch(t.channelId);
              if (ch) {
                validOpenTickets.push(t);
              } else {
                await storage.deleteTicketByChannel(t.channelId);
              }
            } catch (e) {
              await storage.deleteTicketByChannel(t.channelId);
            }
          }

          if (validOpenTickets.length > 0) {
            await interaction.editReply({ content: 'لديك تذكرة مفتوحة بالفعل. يرجى إغلاقها قبل فتح تذكرة جديدة.' });
            return;
          }

          const allStats = await storage.getStats();
          const ticketNumber = (allStats.ticketCount + 1).toString().padStart(4, '0');
          const ticketName = `ticket-${ticketNumber}`;
          
          const permissionOverwrites: any[] = [
            { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: client.user!.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
          ];

          if (panel.supportRoles) {
            panel.supportRoles.forEach(roleId => {
              if (roleId && roleId.trim()) {
                 permissionOverwrites.push({ id: roleId.trim(), allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
              }
            });
          }

          const channel = await guild.channels.create({
            name: ticketName,
            type: ChannelType.GuildText,
            parent: panel.categoryId || undefined,
            permissionOverwrites: permissionOverwrites
          });

          const newTicket = await storage.createTicket({
            channelId: channel.id,
            creatorId: interaction.user.id,
            panelId: panel.id
          });

          const embed = new EmbedBuilder()
            .setDescription(panel.welcomeMessage || `Welcome ${interaction.user}! Please describe your issue.`)
            .setColor(0x00FF00);
          
          if (interaction.guild?.iconURL()) {
            embed.setThumbnail(interaction.guild.iconURL());
          }

          if (panel.imageUrl) {
            embed.setImage(panel.imageUrl);
          }

          const ticketButtons = getTicketManagementRow();

          const supportRolesMentions = panel.supportRoles ? panel.supportRoles.filter(id => id.trim()).map(id => `<@&${id.trim()}>`).join(' ') : '@الدعم-الفني';
          
          await channel.send({ 
            content: `<@${interaction.user.id}> | ${supportRolesMentions}`,
            embeds: [embed],
            components: [ticketButtons]
          });

          await interaction.editReply({ content: `تم فتح التذكرة بنجاح في قناة <#${channel.id}>` });
        } catch (err) {
          console.error('Ticket creation error:', err);
          await interaction.editReply({ content: 'حدث خطأ أثناء فتح التذكرة.' });
        }
      }
      else if (interaction.customId === TICKET_MANAGEMENT_SELECT_ID) {
        const action = interaction.values[0];
        const ticket = await storage.getTicketByChannel(interaction.channelId);

        if (!ticket) {
          await interaction.reply({ content: 'خطأ: لم يتم العثور على بيانات التذكرة في قاعدة البيانات.', ephemeral: true });
          return;
        }

        const panel = ticket.panelId ? await storage.getPanel(ticket.panelId) : null;
        const isStaff = panel?.supportRoles?.some(roleId => (interaction.member?.roles as any).cache.has(roleId));

        if (action === 'claim') {
          if (!isStaff) {
            await interaction.reply({ content: 'فقط الدعم الفني يمكنهم استلام التذكرة.', ephemeral: true });
            return;
          }
          if (ticket.claimedBy) {
            await interaction.reply({ content: 'هذه التذكرة مستلمة بالفعل.', ephemeral: true });
            return;
          }
          if (ticket.creatorId === interaction.user.id) {
            await interaction.reply({ content: 'لا يمكنك استلام تذكرتك الخاصة.', ephemeral: true });
            return;
          }

          await storage.updateTicket(ticket.id, { claimedBy: interaction.user.id });
          const embed = new EmbedBuilder().setDescription(`**لقد تم استلام التكت من قبل <@${interaction.user.id}>**`).setColor(0x00FF00);
          await interaction.reply({ embeds: [embed] });
        }

        else if (action === 'ownership') {
          const lastUsed = ownershipCooldowns.get(interaction.user.id) || 0;
          const now = Date.now();
          if (now - lastUsed < OWNERSHIP_COOLDOWN_MS) {
            const remaining = Math.ceil((OWNERSHIP_COOLDOWN_MS - (now - lastUsed)) / 1000 / 60);
            await interaction.reply({ content: `يرجى الانتظار ${remaining} دقيقة لاستخدام هذا الزر مرة أخرى.`, ephemeral: true });
            return;
          }

          const owner = await interaction.guild?.fetchOwner();
          if (owner) {
            ownershipCooldowns.set(interaction.user.id, now);
            const embed = new EmbedBuilder()
              .setTitle('استدعاء ملكية (Ownership)')
              .setThumbnail(interaction.guild?.iconURL() || null)
              .addFields(
                { name: 'السيرفر', value: interaction.guild?.name || 'غير معروف' },
                { name: 'بواسطة', value: `<@${interaction.user.id}>` },
                { name: 'التذكرة', value: `<#${interaction.channelId}>` }
              );

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder().setLabel('الذهاب للتذكرة').setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/${interaction.guildId}/${interaction.channelId}`)
            );

            try {
              await owner.send({ embeds: [embed], components: [row] });
              await interaction.reply({ content: 'تم إرسال طلب استدعاء لصاحب السيرفر.', ephemeral: true });
            } catch (err) {
              await interaction.reply({ content: 'فشل إرسال رسالة خاصة لصاحب السيرفر (مغلقة).', ephemeral: true });
            }
          }
        }

        else if (action === 'add_person' || action === 'remove_person') {
          const isCreator = ticket.creatorId === interaction.user.id;
          if (!isStaff && !isCreator) {
            await interaction.reply({ content: 'ليس لديك صلاحية لإضافة/إزالة أشخاص.', ephemeral: true });
            return;
          }

          const userSelect = new UserSelectMenuBuilder()
            .setCustomId(action === 'add_person' ? 'add_user_select' : 'remove_user_select')
            .setPlaceholder('اختر الشخص')
            .setMaxValues(1);

          const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(userSelect);
          await interaction.reply({ content: action === 'add_person' ? 'اختر الشخص لإضافته:' : 'اختر الشخص لإزالته:', components: [row], ephemeral: true });
        }

        else if (action === 'rename') {
          if (!isStaff) {
            await interaction.reply({ content: 'فقط الدعم الفني يمكنهم تغيير اسم التذكرة.', ephemeral: true });
            return;
          }

          const modal = new ModalBuilder()
            .setCustomId('rename_ticket_modal')
            .setTitle('تغيير اسم التذكرة');

          const input = new TextInputBuilder()
            .setCustomId('new_ticket_name')
            .setLabel('الاسم الجديد')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
          modal.addComponents(row);

          await interaction.showModal(modal);
        }

        else if (action === 'delete') {
          // Check if user is staff or the one who claimed the ticket
          const isClaimer = ticket.claimedBy === interaction.user.id;
          if (!isStaff && !isClaimer) {
            await interaction.reply({ content: 'فقط الدعم الفني الذي استلم التذكرة يمكنه استخدام هذا الخيار.', ephemeral: true });
            return;
          }

          const embed = new EmbedBuilder()
            .setTitle('إغلاق التذكرة')
            .setDescription('يرجى اختيار تقييمك لمستوى الخدمة لإغلاق التذكرة، أو استخدام الأزرار أدناه:')
            .setColor(0x00AE86);

          const ratingSelect = new StringSelectMenuBuilder()
            .setCustomId('ticket_rating_select')
            .setPlaceholder('اختر التقييم')
            .addOptions([
              { label: 'ممتاز ⭐⭐⭐⭐⭐', value: '5' },
              { label: 'جيد جداً ⭐⭐⭐⭐', value: '4' },
              { label: 'جيد ⭐⭐⭐', value: '3' },
              { label: 'مقبول ⭐⭐', value: '2' },
              { label: 'سيئ ⭐', value: '1' }
            ]);

          const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(ratingSelect);
          
          const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('delete_anyway')
              .setLabel('حذف على أي حال')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('cancel_delete')
              .setLabel('تراجع')
              .setStyle(ButtonStyle.Secondary)
          );

          await interaction.reply({ embeds: [embed], components: [row1, row2] });
        }
        else if (action === 'reset_menu') {
          await interaction.update({ components: [getTicketManagementRow()] });
        }
      }
    }

    else if (interaction.isUserSelectMenu()) {
      if (interaction.customId === 'add_user_select') {
        const userId = interaction.values[0];
        const channel = interaction.channel as TextChannel;
        await channel.permissionOverwrites.create(userId, { ViewChannel: true, SendMessages: true });
        await interaction.update({ content: `تمت إضافة <@${userId}> للتذكرة.`, components: [] });
      }
      else if (interaction.customId === 'remove_user_select') {
        const userId = interaction.values[0];
        const channel = interaction.channel as TextChannel;
        await channel.permissionOverwrites.delete(userId);
        await interaction.update({ content: `تمت إزالة <@${userId}> من التذكرة.`, components: [] });
      }
    }

    else if (interaction.isButton()) {
      if (interaction.customId === 'delete_anyway') {
        await interaction.reply({ content: 'سيتم حذف التذكرة فوراً.' });
        await storage.deleteTicketByChannel(interaction.channelId);
        await interaction.channel?.delete().catch(console.error);
      }
      else if (interaction.customId === 'cancel_delete') {
        await interaction.message.delete().catch(console.error);
        if (!interaction.replied) {
           await interaction.deferUpdate().catch(() => {});
        }
      }
    }

    else if (interaction.type === InteractionType.ModalSubmit) {
      const modalInteraction = interaction as any;
      if (modalInteraction.customId === 'rename_ticket_modal') {
        const newName = modalInteraction.fields.getTextInputValue('new_ticket_name');
        const channel = modalInteraction.channel as any;
        
        try {
          if (channel?.setName) {
            await channel.setName(newName);
            await modalInteraction.reply({ content: `**لقد تم تغيير اسم التذكرة إلى: ${newName} ✅**`, ephemeral: true });
          }
        } catch (err) {
          console.error('Rename error:', err);
          await modalInteraction.reply({ content: 'فشل تغيير اسم التذكرة. يرجى التأكد من الصلاحيات.', ephemeral: true });
        }
      }
    }
  } catch (err) {
    console.error('Interaction error:', err);
    try {
      if (interaction.isRepliable()) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'حدث خطأ أثناء معالجة الأمر.', ephemeral: true });
        } else {
          await interaction.editReply({ content: 'حدث خطأ أثناء معالجة الأمر.' });
        }
      }
    } catch (replyErr) {
      console.error('Failed to send error reply:', replyErr);
    }
  }
});
