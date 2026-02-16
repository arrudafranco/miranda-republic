import type { GameState } from '../types/game';
import { getDifficultyConfig } from '../types/game';
import type { RivalBackground } from '../types/rival';
import { clamp, randomChoice } from '../utils/helpers';

// ── Rival action templates ──────────────────────────────────────────────

type PowerTier = 'low' | 'mid' | 'high';
type Weakness = 'legitimacy' | 'inflation' | 'no_majority' | 'polarization' | 'narrative' | 'baseline';

interface ActionTemplate {
  tier: PowerTier;
  weakness?: Weakness;  // if omitted, matches any weakness (baseline)
  text: string;
}

const RIVAL_ACTIONS: Record<RivalBackground, ActionTemplate[]> = {
  congressional_leader: [
    // ── Low tier (15 lines) ──
    { tier: 'low', text: 'Filing motions. Three hundred pages. Nobody reads them yet.' },
    { tier: 'low', text: 'Quietly meeting with freshman representatives after hours.' },
    { tier: 'low', text: 'Building a mailing list. Every disgruntled voter gets a letter.' },
    { tier: 'low', text: 'Hired two new staffers from your old campaign team.' },
    { tier: 'low', text: 'Gave a floor speech to an empty chamber. The transcript circulated anyway.' },
    { tier: 'low', text: 'Requested copies of every executive order from the past six months.' },
    { tier: 'low', text: 'Hosted a lunch for junior legislators. The menu was modest. The agenda was not.' },
    { tier: 'low', text: 'Published an open letter to the Finance Ministry. Polite, footnoted, devastating.' },
    { tier: 'low', text: 'Sat in the visitor gallery during your budget address. Took notes. Said nothing.' },
    { tier: 'low', text: 'Commissioned a parliamentary research brief on executive overreach precedents.' },
    { tier: 'low', text: 'Moved offices to a larger suite. The hallway traffic shifted with the furniture.' },
    { tier: 'low', weakness: 'legitimacy', text: 'Requesting an audit of last year\'s budget. Looking for cracks.' },
    { tier: 'low', weakness: 'inflation', text: 'Distributed grocery price comparisons to every legislator\'s inbox.' },
    { tier: 'low', weakness: 'narrative', text: 'Circulated a highlights reel of your worst press conferences. No commentary needed.' },
    { tier: 'low', weakness: 'polarization', text: 'Started a cross-party breakfast club. Described it as "healing." The invitation list was selective.' },

    // ── Mid tier (20 lines) ──
    { tier: 'mid', text: 'Whipping votes behind closed doors. The count is shifting.' },
    { tier: 'mid', text: 'Called a press conference on the capitol steps. Cameras everywhere.' },
    { tier: 'mid', text: 'Formed a bipartisan "accountability caucus." Your allies are nervous.' },
    { tier: 'mid', text: 'Blocked your infrastructure bill in committee. Smiled for the cameras.' },
    { tier: 'mid', text: 'Leaked a draft of your next budget proposal. The reaction was ugly.' },
    { tier: 'mid', text: 'Invited foreign ambassadors to a private congressional briefing. You were not mentioned by name.' },
    { tier: 'mid', text: 'Published quarterly "governance scorecards." Your departments scored poorly.' },
    { tier: 'mid', text: 'Demanded a special committee on executive spending. Got the votes to form one.' },
    { tier: 'mid', text: 'Held a televised town hall in your home district. The audience was sympathetic... to the opposition.' },
    { tier: 'mid', text: 'Rescheduled the vote on your trade bill to a day when three allies were traveling.' },
    { tier: 'mid', text: 'Started referring to your cabinet as "the previous administration" in floor speeches.' },
    { tier: 'mid', text: 'Introduced a bill limiting executive emergency powers. The timing was not coincidental.' },
    { tier: 'mid', text: 'Subpoenaed records from two ministries simultaneously. Your legal team is stretched thin.' },
    { tier: 'mid', weakness: 'polarization', text: 'United the opposition caucus around a single message. Yours is the problem.' },
    { tier: 'mid', weakness: 'no_majority', text: 'Rallied the crossbenchers. Your legislative agenda is stalling.' },
    { tier: 'mid', weakness: 'narrative', text: 'Circulated a counter-narrative memo to every newsroom in the capital.' },
    { tier: 'mid', weakness: 'legitimacy', text: 'Tabled a no-confidence motion. Not enough votes yet... but close.' },
    { tier: 'mid', weakness: 'inflation', text: 'Read grocery receipts into the congressional record. Spent forty minutes on bread prices alone.' },
    { tier: 'mid', weakness: 'no_majority', text: 'Offered committee chairmanships to two of your wavering allies. One accepted.' },
    { tier: 'mid', weakness: 'narrative', text: 'Hired a former state television producer. The opposition\'s media game just improved.' },

    // ── High tier (25 lines) ──
    { tier: 'high', text: 'The opposition caucus votes in lockstep now. Every bill is a battle.' },
    { tier: 'high', text: 'Announced a shadow cabinet. The papers are running profiles.' },
    { tier: 'high', text: 'Held a rally on the national mall. Attendance exceeded expectations.' },
    { tier: 'high', text: 'Delivered an address titled "The State of the Republic." It wasn\'t flattering.' },
    { tier: 'high', text: 'Organized a congressional walkout during your economic address. The empty seats were the story.' },
    { tier: 'high', text: 'Filed a formal constitutional challenge to your latest executive order.' },
    { tier: 'high', text: 'Foreign journalists are requesting interviews with the opposition leader, not the president.' },
    { tier: 'high', text: 'The shadow cabinet held its first public briefing. Attendance was standing room only.' },
    { tier: 'high', text: 'Called for early elections. The motion didn\'t pass, but the margin was thin.' },
    { tier: 'high', text: 'Published a hundred-page alternative budget. The economists preferred it.' },
    { tier: 'high', text: 'Opened a parallel diplomatic channel with the Colossus. Your ambassador was not informed.' },
    { tier: 'high', text: 'Gave a prime-time television address. The networks carried it live without your office\'s consent.' },
    { tier: 'high', text: 'Three of your cabinet members asked for private meetings this week. They looked worried.' },
    { tier: 'high', text: 'The congressional gift shop now sells opposition merchandise. The irony is deliberate.' },
    { tier: 'high', text: 'Moved to strip your emergency budget authority. The votes are there.' },
    { tier: 'high', weakness: 'legitimacy', text: 'Drafting articles of no confidence. The signatures are almost there.' },
    { tier: 'high', weakness: 'inflation', text: 'Introduced an emergency price stabilization act. Your move.' },
    { tier: 'high', weakness: 'no_majority', text: 'Controls the legislative calendar now. Nothing passes without approval.' },
    { tier: 'high', weakness: 'legitimacy', text: 'Released polling data showing 60% support for impeachment proceedings.' },
    { tier: 'high', weakness: 'polarization', text: 'Positioned as the "unity candidate." Your polarization is being weaponized.' },
    { tier: 'high', weakness: 'narrative', text: 'Every major newsroom has a dedicated opposition correspondent now. You have none.' },
    { tier: 'high', weakness: 'inflation', text: 'Proposed a congressional price oversight board. Markets rallied on the announcement.' },
    { tier: 'high', weakness: 'no_majority', text: 'Your remaining allies in congress held a private meeting. It was about exit strategies.' },
    { tier: 'high', weakness: 'polarization', text: 'Hosted a "national healing summit." The invitation pointedly excluded your office.' },
    { tier: 'high', weakness: 'narrative', text: 'Commissioned a documentary on "the truth about the presidency." It airs next month.' },
  ],

  regional_governor: [
    // ── Low tier (15 lines) ──
    { tier: 'low', text: 'Opened a new clinic in the provinces. Local papers covered it warmly.' },
    { tier: 'low', text: 'Touring rural districts. Shaking hands, learning names.' },
    { tier: 'low', text: 'Hosted a town hall in the northern highlands. Standing room only.' },
    { tier: 'low', text: 'Published an op-ed about regional neglect. Polite, but pointed.' },
    { tier: 'low', text: 'Met with local business owners. Promised less interference from the capital.' },
    { tier: 'low', text: 'Inaugurated a small bridge in a forgotten district. The speech lasted longer than the ribbon cutting.' },
    { tier: 'low', text: 'Distributed seed packets to rural farmers. The bags had the governor\'s face on them.' },
    { tier: 'low', text: 'Attended a village festival in the eastern provinces. Danced badly. Was loved for it.' },
    { tier: 'low', text: 'Hired local engineers instead of capital firms for a road project. The message was clear.' },
    { tier: 'low', text: 'Started a regional radio hour. "Straight talk from outside the capital."' },
    { tier: 'low', text: 'Visited a school that hasn\'t seen a federal inspector in three years. Brought cameras.' },
    { tier: 'low', weakness: 'inflation', text: 'Announced a regional food subsidy. Funded from the provincial budget.' },
    { tier: 'low', weakness: 'legitimacy', text: 'Quietly polling in your weakest districts. Gathering ammunition.' },
    { tier: 'low', weakness: 'narrative', text: 'Gave an interview to a regional paper. Called the capital "disconnected." It trended nationally.' },
    { tier: 'low', weakness: 'polarization', text: 'Hosted a "people\'s forum" where citizens aired grievances about the capital. No one defended you.' },

    // ── Mid tier (20 lines) ──
    { tier: 'mid', text: 'Three more governors signed a joint statement backing the opposition.' },
    { tier: 'mid', text: 'Established a parallel development fund. Bypassing your ministries entirely.' },
    { tier: 'mid', text: 'Organized a governors\' summit. Your invitation got lost in the mail.' },
    { tier: 'mid', text: 'Regional police forces are coordinating under opposition direction now.' },
    { tier: 'mid', text: 'Blocked federal road construction in two provinces. "Permit issues."' },
    { tier: 'mid', text: 'Launched a provincial jobs program. Paid better than your federal version.' },
    { tier: 'mid', text: 'Built a regional hospital that puts the capital\'s facilities to shame.' },
    { tier: 'mid', text: 'Convinced two provincial tax offices to delay remittances to the capital.' },
    { tier: 'mid', text: 'Opened provincial trade offices in three neighboring countries. Without consulting your foreign ministry.' },
    { tier: 'mid', text: 'Regional bus routes now bypass the capital entirely. A practical and symbolic decision.' },
    { tier: 'mid', text: 'Published a "provincial prosperity index" showing the capital dragging down averages.' },
    { tier: 'mid', text: 'Hired away your best regional administrators. Offered housing and a shorter commute.' },
    { tier: 'mid', text: 'The provincial assembly passed a resolution calling federal policies "inadequate." Unanimously.' },
    { tier: 'mid', weakness: 'narrative', text: 'Launched a regional media network. Your message doesn\'t reach the provinces anymore.' },
    { tier: 'mid', weakness: 'polarization', text: 'Playing peacemaker between factions. Making you look like the divisive one.' },
    { tier: 'mid', weakness: 'no_majority', text: 'Provincial legislators are siding with the governors over the capital.' },
    { tier: 'mid', weakness: 'inflation', text: 'Set up regional price controls. They\'re working... and that\'s the problem.' },
    { tier: 'mid', weakness: 'legitimacy', text: 'Invited international observers to "evaluate governance quality" in the regions vs. the capital.' },
    { tier: 'mid', weakness: 'narrative', text: 'The provincial newspapers stopped reprinting your press releases. They have their own stories now.' },
    { tier: 'mid', weakness: 'inflation', text: 'Regional farmers\' markets sell at pre-crisis prices. Signs say "No capital middlemen."' },

    // ── High tier (25 lines) ──
    { tier: 'high', text: 'Six provinces now operate semi-autonomously. Federal authority is theoretical.' },
    { tier: 'high', text: 'Declared a "regional state of emergency." The constitutional basis is thin.' },
    { tier: 'high', text: 'The provincial assemblies are drafting a confederal charter.' },
    { tier: 'high', text: 'Ordered provincial police to stop enforcing federal tax collection.' },
    { tier: 'high', text: 'A provincial governor refused to attend your national address. Sent a deputy. The deputy also declined.' },
    { tier: 'high', text: 'Regional currencies have started circulating in three provinces. Unofficial, but accepted.' },
    { tier: 'high', text: 'The governors\' coalition issued its own foreign policy statement. The Colossus responded to it.' },
    { tier: 'high', text: 'Federal employees in the provinces are being offered "regional contracts." Most are accepting.' },
    { tier: 'high', text: 'The provincial road network now connects all regions while bypassing the capital entirely.' },
    { tier: 'high', text: 'Organized a "March of the Provinces." The convoy stretched for forty kilometers.' },
    { tier: 'high', text: 'The regional development fund now outspends your federal budget for infrastructure.' },
    { tier: 'high', text: 'Three provinces stopped sending congressional delegates. "Until the capital listens."' },
    { tier: 'high', text: 'The governor\'s approval rating in the provinces is triple yours. The gap is widening.' },
    { tier: 'high', text: 'Provincial courts began ruling federal regulations "inapplicable outside the capital district."' },
    { tier: 'high', text: 'Your ministers need the governor\'s permission to visit the provinces now. They don\'t always get it.' },
    { tier: 'high', weakness: 'legitimacy', text: 'Calling for a constitutional convention. Says the presidency has failed.' },
    { tier: 'high', weakness: 'narrative', text: 'Controls the narrative outside the capital. Your story ends at the city limits.' },
    { tier: 'high', weakness: 'no_majority', text: 'Provincial blocs are defecting en masse. The center cannot hold.' },
    { tier: 'high', weakness: 'legitimacy', text: 'The provinces held a referendum on "confidence in the federal government." You lost.' },
    { tier: 'high', weakness: 'inflation', text: 'Provincial price controls are working. The contrast with the capital is humiliating.' },
    { tier: 'high', weakness: 'polarization', text: 'Presented the regions as "the real Miranda" while calling the capital "the problem."' },
    { tier: 'high', weakness: 'narrative', text: 'Regional media outlets formed a consortium. They no longer carry federal press conferences.' },
    { tier: 'high', weakness: 'no_majority', text: 'Half your congressional allies represent rural districts. They\'re getting calls from the governor.' },
    { tier: 'high', weakness: 'inflation', text: 'Set up a provincial grain reserve. While the capital\'s shelves empty, the provinces eat well.' },
    { tier: 'high', weakness: 'polarization', text: 'Framed the national divide as "capital vs. country." Every province picked a side.' },
  ],

  retired_general: [
    // ── Low tier (15 lines) ──
    { tier: 'low', text: 'Gave an interview about "the old days." Nostalgia is a weapon.' },
    { tier: 'low', text: 'Visited the military academy. The cadets stood a little straighter.' },
    { tier: 'low', text: 'Published a memoir chapter. The implications about civilian leadership were clear.' },
    { tier: 'low', text: 'Having lunch with retired officers. Every week, same restaurant.' },
    { tier: 'low', text: 'Attended a veterans\' memorial ceremony. The speech was short and sharp.' },
    { tier: 'low', text: 'Sent condolence letters to the families of three fallen soldiers. Your office sent form letters.' },
    { tier: 'low', text: 'Reviewed a parade of cadets. The march was crisper than anything your administration has produced.' },
    { tier: 'low', text: 'Gave a lecture on "national resilience" at the war college. The auditorium was full.' },
    { tier: 'low', text: 'Photographed visiting a military hospital. The patients asked the general to stay longer.' },
    { tier: 'low', text: 'Wrote a newspaper column about "discipline and national character." It was reprinted in twelve papers.' },
    { tier: 'low', text: 'Plays chess at the officers\' club every Thursday. The games are short. The conversations are long.' },
    { tier: 'low', weakness: 'legitimacy', text: 'Mentioned "institutional stability" three times in one interview. A signal.' },
    { tier: 'low', weakness: 'polarization', text: 'Warned about "national fracture" on a morning talk show. Measured tone.' },
    { tier: 'low', weakness: 'narrative', text: 'Called the media "confused" in a radio interview. Veterans\' groups amplified the quote.' },
    { tier: 'low', weakness: 'inflation', text: 'Visited a military commissary. Compared prices to civilian stores. The difference was noted.' },

    // ── Mid tier (20 lines) ──
    { tier: 'mid', text: 'Active-duty officers are requesting transfers to units under friendly command.' },
    { tier: 'mid', text: 'Established a "national security advisory council." Parallel command structure.' },
    { tier: 'mid', text: 'Three garrison commanders attended a private dinner. No one reported what was discussed.' },
    { tier: 'mid', text: 'Defense contractors are routing proposals through the general\'s office first.' },
    { tier: 'mid', text: 'Published a white paper on "constitutional crisis protocols." Read between the lines.' },
    { tier: 'mid', text: 'Conducted an "informal inspection" of the border garrisons. They let the general in.' },
    { tier: 'mid', text: 'Veterans\' associations consolidated under a single umbrella organization. The general chairs it.' },
    { tier: 'mid', text: 'Retired colonels are appearing on television panels. Their talking points are synchronized.' },
    { tier: 'mid', text: 'The military pension fund redirected its annual gala invitation. Your name was removed.' },
    { tier: 'mid', text: 'Organized a "readiness symposium." Active-duty officers attended on their own time.' },
    { tier: 'mid', text: 'The general\'s motorcade now includes two security vehicles. Nobody authorized them.' },
    { tier: 'mid', text: 'Quietly meeting with the chiefs of intelligence. "Old colleagues catching up."' },
    { tier: 'mid', text: 'Military supply chains are subtly reorganizing. The new routes pass through friendly jurisdictions.' },
    { tier: 'mid', weakness: 'legitimacy', text: 'Gave a televised address about "restoring order." Didn\'t specify whose order.' },
    { tier: 'mid', weakness: 'inflation', text: 'Proposed military-run supply distribution. "Efficiency," the general says.' },
    { tier: 'mid', weakness: 'narrative', text: 'Veterans\' groups are amplifying opposition messaging on every channel.' },
    { tier: 'mid', weakness: 'no_majority', text: 'Reminded the legislature that the military "serves the constitution, not the president."' },
    { tier: 'mid', weakness: 'polarization', text: 'Published an essay on "unity through strength." The subtext was not subtle.' },
    { tier: 'mid', weakness: 'legitimacy', text: 'Visited border posts and spoke about "the government we deserve." The troops listened.' },
    { tier: 'mid', weakness: 'narrative', text: 'Leaked a military assessment of "national governance capacity." Your rating was low.' },

    // ── High tier (25 lines) ──
    { tier: 'high', text: 'Military exercises near the capital. "Routine," according to the press office.' },
    { tier: 'high', text: 'The joint chiefs requested a "private consultation." The tone was not optional.' },
    { tier: 'high', text: 'Armored units repositioned to three provincial capitals overnight.' },
    { tier: 'high', text: 'The general appeared on the palace steps. Uninvited. The guards did not stop the motorcade.' },
    { tier: 'high', text: 'Military communications switched to encrypted channels your intelligence services can\'t access.' },
    { tier: 'high', text: 'The air force conducted flyovers during your national day address. You didn\'t order them.' },
    { tier: 'high', text: 'Garrison commanders stopped filing routine reports to the defense ministry. "Channel realignment."' },
    { tier: 'high', text: 'Three generals made a joint television appearance. They wore dress uniforms. They did not smile.' },
    { tier: 'high', text: 'Military convoys moved through the capital at dawn. The route passed the presidential palace.' },
    { tier: 'high', text: 'The defense budget proposal arrived pre-approved. Your input was listed as "optional."' },
    { tier: 'high', text: 'Soldiers at checkpoints have new patches. The insignia is unfamiliar.' },
    { tier: 'high', text: 'The general\'s headquarters now receives foreign military attaches. Directly.' },
    { tier: 'high', text: 'Your scheduled visit to the naval base was "postponed due to operational requirements."' },
    { tier: 'high', text: 'Military-affiliated businesses stopped paying federal taxes. The enforcement agencies did not respond.' },
    { tier: 'high', text: 'The general gave a speech about "the sacred duty of the armed forces." The crowd was not military.' },
    { tier: 'high', weakness: 'legitimacy', text: 'Released a statement about "the constitutional duty to preserve the republic." Ominous.' },
    { tier: 'high', weakness: 'polarization', text: 'Offered to "mediate" between political factions. With tanks nearby.' },
    { tier: 'high', weakness: 'inflation', text: 'Promised military price enforcement. The markets are already responding.' },
    { tier: 'high', weakness: 'legitimacy', text: 'The military issued a statement on "the limits of civilian authority." They cited specific articles.' },
    { tier: 'high', weakness: 'no_majority', text: 'Officers briefed congressional leaders on "contingency planning." Your allies were not briefed.' },
    { tier: 'high', weakness: 'narrative', text: 'Military television channels now broadcast 24 hours. Their version of events differs from yours.' },
    { tier: 'high', weakness: 'inflation', text: 'Military commissaries opened to civilians. The prices are stable. The lines are long.' },
    { tier: 'high', weakness: 'polarization', text: 'The general described the national divide as "a security matter." The phrasing was deliberate.' },
    { tier: 'high', weakness: 'no_majority', text: 'Military advisors appeared at congressional committee hearings. Nobody invited them.' },
    { tier: 'high', weakness: 'narrative', text: 'The general\'s daily briefing gets more viewership than your press secretary\'s.' },
  ],

  media_personality: [
    // ── Low tier (15 lines) ──
    { tier: 'low', text: 'Recording another podcast episode. Subscriber count climbing.' },
    { tier: 'low', text: 'Posted a thread dissecting your latest speech. Went viral by lunch.' },
    { tier: 'low', text: 'Appeared on three talk shows this week. Always charming, always on message.' },
    { tier: 'low', text: 'Started a YouTube documentary series. "Inside Miranda\'s Crisis."' },
    { tier: 'low', text: 'Trending on social media again. The algorithm favors outrage.' },
    { tier: 'low', text: 'Released a "fact check" video on your infrastructure claims. 2 million views in a day.' },
    { tier: 'low', text: 'Hosted a charity livestream. Raised more than your last public fundraiser.' },
    { tier: 'low', text: 'Started a weekly newsletter. "What the Palace Won\'t Tell You."' },
    { tier: 'low', text: 'Photographed having coffee with a former minister. The caption was just a smiling emoji.' },
    { tier: 'low', text: 'Released a remix of your stammered press conference answer. It has a beat now.' },
    { tier: 'low', text: 'Opened a social media poll asking "Is the president doing a good job?" You lost.' },
    { tier: 'low', weakness: 'inflation', text: 'Ran the grocery receipt segment again. Viewers know what a peso buys now.' },
    { tier: 'low', weakness: 'narrative', text: 'Fact-checked your press secretary live on air. It was devastating.' },
    { tier: 'low', weakness: 'legitimacy', text: 'Posted a "promises vs. reality" compilation. The view count is climbing.' },
    { tier: 'low', weakness: 'polarization', text: 'Interviewed families on both sides of the divide. Made you look responsible for both.' },

    // ── Mid tier (20 lines) ──
    { tier: 'mid', text: 'Launched a daily morning show. Higher ratings than state television.' },
    { tier: 'mid', text: 'Organized a public debate. Your spokesperson declined. That was the story.' },
    { tier: 'mid', text: 'Three major advertisers pulled from state media. Following the audience.' },
    { tier: 'mid', text: 'Published leaked internal memos. Your comms team is scrambling.' },
    { tier: 'mid', text: 'Created a citizen journalism network. Thousands of phones, all watching.' },
    { tier: 'mid', text: 'Launched a mobile app tracking government spending in real time.' },
    { tier: 'mid', text: 'Organized a "truth festival" in the capital. Bands played between policy panels.' },
    { tier: 'mid', text: 'Your press secretary\'s statements are now live-annotated on the opposition stream.' },
    { tier: 'mid', text: 'Started a "government report card" series. This week\'s grade was not passing.' },
    { tier: 'mid', text: 'Signed a distribution deal with an international streaming platform.' },
    { tier: 'mid', text: 'The hashtag #WhatDidTheyPromise trended for three consecutive days.' },
    { tier: 'mid', text: 'Published the salary figures of your top advisors. The public reaction was predictable.' },
    { tier: 'mid', text: 'Organized a "wall of receipts" outside the finance ministry. Literal grocery receipts.' },
    { tier: 'mid', weakness: 'legitimacy', text: 'Ran a week-long series on "broken promises." Every episode lands.' },
    { tier: 'mid', weakness: 'polarization', text: 'Playing both sides on the culture divide. Stoking fires while looking concerned.' },
    { tier: 'mid', weakness: 'narrative', text: 'Hired your former press secretary. They know all the talking points.' },
    { tier: 'mid', weakness: 'inflation', text: 'Live-streamed from a supermarket. The empty shelves told the story.' },
    { tier: 'mid', weakness: 'no_majority', text: 'Interviewed wavering legislators on air. They looked uncomfortable defending you.' },
    { tier: 'mid', weakness: 'legitimacy', text: 'Crowdsourced a "people\'s audit" of government contracts. The findings went viral.' },
    { tier: 'mid', weakness: 'narrative', text: 'Released a deepfake parody of your national address. Technically satire. Practically devastating.' },

    // ── High tier (25 lines) ──
    { tier: 'high', text: 'Prime time special. "The Failed Presidency." Airing tomorrow.' },
    { tier: 'high', text: 'Endorsed opposition candidates on every platform simultaneously. Coordinated strike.' },
    { tier: 'high', text: 'Organized a million-viewer livestream rally. The streets filled to match.' },
    { tier: 'high', text: 'International media outlets now credit the opposition personality as "Miranda\'s real voice."' },
    { tier: 'high', text: 'Launched "Miranda Uncensored," a 24/7 opposition news channel. Viewership exceeded state TV on day one.' },
    { tier: 'high', text: 'Your cabinet meeting agenda appeared online before your ministers received it.' },
    { tier: 'high', text: 'Organized simultaneous protests in every provincial capital. All livestreamed. All viral.' },
    { tier: 'high', text: 'Released secretly recorded audio from inside a ministry. The content was damaging.' },
    { tier: 'high', text: 'The opposition\'s social media following now exceeds the government\'s by a factor of ten.' },
    { tier: 'high', text: 'Your ministers refuse to appear on any program the opposition personality might also attend.' },
    { tier: 'high', text: 'A feature film about "the crisis" is in production. The lead villain is barely disguised.' },
    { tier: 'high', text: 'The opposition personality was nominated for an international press freedom award.' },
    { tier: 'high', text: 'Billboard ads appeared across the capital overnight. Your face, their message.' },
    { tier: 'high', text: 'The opposition\'s daily viewership is now a national institution. Missing it feels abnormal.' },
    { tier: 'high', text: 'Organized a "people\'s congress" online. Three million votes on policy resolutions.' },
    { tier: 'high', weakness: 'legitimacy', text: 'Countdown clock on every broadcast. "Days until accountability."' },
    { tier: 'high', weakness: 'narrative', text: 'Controls the narrative completely. Your version of events doesn\'t reach anyone.' },
    { tier: 'high', weakness: 'no_majority', text: 'Running attack ads against every legislator who supports you. It\'s working.' },
    { tier: 'high', weakness: 'legitimacy', text: 'Released a documentary on your first hundred days. The title is "What Went Wrong."' },
    { tier: 'high', weakness: 'inflation', text: 'Organized a "price watch" network. Thousands of citizens report prices daily. Your numbers look different.' },
    { tier: 'high', weakness: 'polarization', text: 'Branded your supporters as "extremists" in a viral segment. The middle ground shifted.' },
    { tier: 'high', weakness: 'narrative', text: 'Your press releases get more engagement as opposition content (quoted and mocked) than as news.' },
    { tier: 'high', weakness: 'no_majority', text: 'Live-streamed interviews with every defecting legislator. Each one got a sympathy edit.' },
    { tier: 'high', weakness: 'inflation', text: 'The "grocery receipt challenge" went international. Miranda\'s inflation is now a global story.' },
    { tier: 'high', weakness: 'polarization', text: 'Produced a "both sides" special that somehow made one side look much worse. Yours.' },
  ],
};

const RIVAL_NAMES: Record<RivalBackground, string[]> = {
  congressional_leader: ['Senator Vidal', 'Senator Correa', 'Speaker Moreno'],
  regional_governor:    ['Governor Torres', 'Governor Almeida', 'Governor Fuentes'],
  retired_general:      ['General Cardoso', 'General Montoya', 'General Braga'],
  media_personality:    ['Ricardo Vox', 'Diana Cruz', 'Marco Estrella'],
};

const RIVAL_TITLES: Record<RivalBackground, string> = {
  congressional_leader: 'Congressional Leader',
  regional_governor:    'Regional Governor',
  retired_general:      'Retired General',
  media_personality:    'Media Personality',
};

const BACKGROUNDS: RivalBackground[] = [
  'congressional_leader', 'regional_governor', 'retired_general', 'media_personality',
];

export function generateRivalIdentity() {
  const background = randomChoice(BACKGROUNDS);
  const name = randomChoice(RIVAL_NAMES[background]);
  return {
    name,
    title: RIVAL_TITLES[background],
    background,
  };
}

/**
 * Calculate Rival power delta per turn based on game state.
 */
export function calculateRivalPowerDelta(state: GameState): number {
  let delta = 1; // Base growth (discontent is structural)

  // Polarization above 30: +1 per 5 points
  if (state.resources.polarization > 30) {
    delta += Math.floor((state.resources.polarization - 30) / 5);
  }

  // Inflation above 10: +2 per 5 points
  if (state.resources.inflation > 10) {
    delta += Math.floor((state.resources.inflation - 10) / 5) * 2;
  }

  // Low legitimacy
  if (state.resources.legitimacy < 40) {
    delta += 3;
  }

  // Low labor cohesion
  if (state.laborCohesion < 25) {
    delta += 2;
  }

  // Low narrative
  if (state.resources.narrative < 30) {
    delta += 1;
  }

  // High mobilization counters (-1 per 8 above 40)
  if (state.resources.mobilization > 40) {
    delta -= Math.floor((state.resources.mobilization - 40) / 8);
  }

  // High narrative counters (-2 if >50)
  if (state.resources.narrative > 50) {
    delta -= 2;
  }

  // High labor cohesion counters (-1 per 8 above 40)
  if (state.laborCohesion > 40) {
    delta -= Math.floor((state.laborCohesion - 40) / 8);
  }

  // High legitimacy counters (-2 if >70)
  if (state.resources.legitimacy > 70) {
    delta -= 2;
  }

  // No congressional majority: rival exploits legislative weakness
  if (!state.congress.friendlyMajority) {
    delta += 1;
  }

  // Cap total growth at +8 per turn
  const capped = Math.min(delta, 8);

  // Apply difficulty multiplier after cap
  const config = getDifficultyConfig(state.difficulty);
  return Math.round(capped * config.rivalGrowthMultiplier);
}

/**
 * Determine the player's most exploitable weakness from game state.
 */
function identifyDominantWeakness(state: GameState): Weakness {
  // Check each weakness condition in priority order
  const checks: { weakness: Weakness; condition: boolean; severity: number }[] = [
    { weakness: 'legitimacy', condition: state.resources.legitimacy < 50, severity: 50 - state.resources.legitimacy },
    { weakness: 'inflation', condition: state.resources.inflation > 12, severity: state.resources.inflation - 12 },
    { weakness: 'no_majority', condition: !state.congress.friendlyMajority, severity: 15 },
    { weakness: 'polarization', condition: state.resources.polarization > 40, severity: state.resources.polarization - 40 },
    { weakness: 'narrative', condition: state.resources.narrative < 40, severity: 40 - state.resources.narrative },
  ];

  let best: Weakness = 'baseline';
  let bestSeverity = 0;
  for (const c of checks) {
    if (c.condition && c.severity > bestSeverity) {
      best = c.weakness;
      bestSeverity = c.severity;
    }
  }
  return best;
}

/**
 * Determine power tier from rival power level.
 */
function getPowerTier(power: number): PowerTier {
  if (power >= 66) return 'high';
  if (power >= 36) return 'mid';
  return 'low';
}

/**
 * Generate a context-aware rival action line based on background, power tier, and player weakness.
 */
export function generateRivalAction(state: GameState): string {
  const templates = RIVAL_ACTIONS[state.rival.background];
  if (!templates) return '';

  const tier = getPowerTier(state.rival.power);
  const weakness = identifyDominantWeakness(state);

  // Get all lines for this tier
  const tierLines = templates.filter(t => t.tier === tier);

  // Prefer weakness-specific lines if available
  const weaknessLines = tierLines.filter(t => t.weakness === weakness);
  if (weaknessLines.length > 0) {
    // 70% chance to use weakness-specific, 30% general
    const pool = [...weaknessLines, ...weaknessLines, ...tierLines.filter(t => !t.weakness)];
    return randomChoice(pool).text;
  }

  // Fall back to general lines for this tier
  const generalLines = tierLines.filter(t => !t.weakness);
  if (generalLines.length > 0) {
    return randomChoice(generalLines).text;
  }

  // Ultimate fallback
  return randomChoice(tierLines).text;
}

/**
 * Check rival thresholds and return event IDs that should fire.
 */
export function checkRivalThresholds(state: GameState): number[] {
  const thresholds = [30, 50, 60, 70, 85, 95];
  const newThresholds: number[] = [];

  for (const threshold of thresholds) {
    if (
      state.rival.power >= threshold &&
      !state.rival.thresholdsFired.includes(threshold)
    ) {
      newThresholds.push(threshold);
    }
  }

  return newThresholds;
}

/**
 * Apply rival power delta and update state.
 */
export function processRivalTurn(state: GameState): void {
  const delta = calculateRivalPowerDelta(state);
  state.rival.powerDelta = delta;
  state.rival.power = clamp(state.rival.power + delta, 0, 100);

  // Generate rival action text for this turn
  state.rival.lastAction = generateRivalAction(state);

  // Track newly crossed thresholds
  const newThresholds = checkRivalThresholds(state);
  state.rival.thresholdsFired.push(...newThresholds);

  // Decrement countdowns
  if (state.rival.gridlockCountdown > 0) {
    state.rival.gridlockCountdown--;
  }
  if (state.rival.cultureWarCountdown > 0) {
    state.rival.cultureWarCountdown--;
    // Culture war: clergy and mainStreet loyalty check
    if (state.blocs.clergy.loyalty < 50) {
      state.blocs.clergy.loyalty = clamp(state.blocs.clergy.loyalty - 5, 0, 100);
    }
    if (state.blocs.mainStreet.loyalty < 50) {
      state.blocs.mainStreet.loyalty = clamp(state.blocs.mainStreet.loyalty - 5, 0, 100);
    }
  }

  // Activate countdowns from newly fired thresholds
  if (newThresholds.includes(50)) {
    state.rival.gridlockCountdown = 4;
  }
  if (newThresholds.includes(60)) {
    state.rival.cultureWarCountdown = 4;
  }
}

/** Export for testing */
export { RIVAL_ACTIONS };
