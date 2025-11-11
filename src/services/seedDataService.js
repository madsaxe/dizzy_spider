import timelineService from './timelineService';

/**
 * Service for populating example/seed data
 */
class SeedDataService {
  /**
   * Helper function to create scenes for an event (1-5 scenes)
   */
  async createScenesForEvent(eventId, scenesData) {
    const sceneCount = Math.min(scenesData.length, Math.floor(Math.random() * 5) + 1); // 1-5 scenes
    const selectedScenes = scenesData.slice(0, sceneCount);
    
    for (const scene of selectedScenes) {
      await timelineService.createScene({
        eventId,
        ...scene,
      });
    }
  }

  /**
   * Create an example historical timeline with 5+ eras
   */
  async createExampleHistoricalTimeline() {
    // Create timeline
    const timeline = await timelineService.createTimeline({
      title: 'World War II Timeline',
      description: 'A comprehensive timeline of major events during World War II',
      isFictional: false,
    });

    // Era 1: Pre-War Period
    const preWarEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'Pre-War Period (1933-1939)',
      description: 'The years leading up to World War II, marked by rising tensions and aggression',
      startTime: '1933-01-01',
      endTime: '1939-08-31',
      order: 0,
    });

    // Era 2: Early War (1939-1941)
    const earlyWarEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'Early War Years (1939-1941)',
      description: 'The initial phase of World War II with rapid German expansion',
      startTime: '1939-09-01',
      endTime: '1941-12-06',
      order: 1,
    });

    // Era 3: Global War (1942-1943)
    const globalWarEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'Global Conflict (1942-1943)',
      description: 'The war expands globally with major turning points',
      startTime: '1942-01-01',
      endTime: '1943-12-31',
      order: 2,
    });

    // Era 4: Allied Advance (1944)
    const alliedAdvanceEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'Allied Advance (1944)',
      description: 'Allied forces gain momentum and push back Axis powers',
      startTime: '1944-01-01',
      endTime: '1944-12-31',
      order: 3,
    });

    // Era 5: End of War (1945)
    const endWarEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'End of War (1945)',
      description: 'The final year of World War II and its conclusion',
      startTime: '1945-01-01',
      endTime: '1945-09-02',
      order: 4,
    });

    // Era 6: Post-War Period
    const postWarEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'Post-War Period (1945-1950)',
      description: 'The aftermath, rebuilding, and the beginning of the Cold War',
      startTime: '1945-09-03',
      endTime: '1950-12-31',
      order: 5,
    });

    // ========== PRE-WAR ERA EVENTS ==========
    const hitlerRise = await timelineService.createEvent({
      eraId: preWarEra.id,
      title: 'Hitler Becomes Chancellor',
      description: 'Adolf Hitler is appointed Chancellor of Germany, marking the beginning of Nazi rule',
      time: '1933-01-30',
      order: 0,
    });
    await this.createScenesForEvent(hitlerRise.id, [
      { title: 'Appointment Ceremony', description: 'Hitler is sworn in as Chancellor in Berlin', time: '1933-01-30', order: 0 },
      { title: 'Public Reaction', description: 'Mixed reactions from the German public and international community', time: '1933-01-30', order: 1 },
      { title: 'First Cabinet Meeting', description: 'Hitler holds his first cabinet meeting with conservative allies', time: '1933-01-31', order: 2 },
    ]);

    const reichstagFire = await timelineService.createEvent({
      eraId: preWarEra.id,
      title: 'Reichstag Fire',
      description: 'The German parliament building is set on fire, used as pretext for emergency powers',
      time: '1933-02-27',
      order: 1,
    });
    await this.createScenesForEvent(reichstagFire.id, [
      { title: 'Fire Breaks Out', description: 'The Reichstag building is set ablaze in the evening', time: '1933-02-27', order: 0 },
      { title: 'Emergency Decree', description: 'Hitler uses the fire to justify the Reichstag Fire Decree', time: '1933-02-28', order: 1 },
      { title: 'Mass Arrests', description: 'Thousands of communists and political opponents are arrested', time: '1933-02-28', order: 2 },
      { title: 'Media Control', description: 'Nazis use the event to justify suppression of free press', time: '1933-03-01', order: 3 },
    ]);

    const nightOfLongKnives = await timelineService.createEvent({
      eraId: preWarEra.id,
      title: 'Night of the Long Knives',
      description: 'Hitler purges the SA leadership and political opponents',
      time: '1934-06-30',
      order: 2,
    });
    await this.createScenesForEvent(nightOfLongKnives.id, [
      { title: 'SA Leadership Targeted', description: 'Hitler orders the elimination of SA leaders including Ernst Röhm', time: '1934-06-30', order: 0 },
      { title: 'Political Opponents Killed', description: 'Former Chancellor Kurt von Schleicher and others are executed', time: '1934-06-30', order: 1 },
      { title: 'Consolidation of Power', description: 'Hitler consolidates his power by eliminating internal threats', time: '1934-07-01', order: 2 },
    ]);

    const remilitarization = await timelineService.createEvent({
      eraId: preWarEra.id,
      title: 'Remilitarization of the Rhineland',
      description: 'Germany violates the Treaty of Versailles by sending troops into the Rhineland',
      time: '1936-03-07',
      order: 3,
    });
    await this.createScenesForEvent(remilitarization.id, [
      { title: 'Troops Enter Rhineland', description: 'German forces cross into the demilitarized zone', time: '1936-03-07', order: 0 },
      { title: 'International Response', description: 'France and Britain protest but take no military action', time: '1936-03-08', order: 1 },
      { title: 'Propaganda Victory', description: 'Hitler celebrates this as a major victory for German sovereignty', time: '1936-03-09', order: 2 },
    ]);

    const anschluss = await timelineService.createEvent({
      eraId: preWarEra.id,
      title: 'Anschluss',
      description: 'Germany annexes Austria in violation of international treaties',
      time: '1938-03-12',
      order: 4,
    });
    await this.createScenesForEvent(anschluss.id, [
      { title: 'German Troops Enter Austria', description: 'Wehrmacht crosses the border into Austria', time: '1938-03-12', order: 0 },
      { title: 'Hitler Arrives in Vienna', description: 'Hitler makes a triumphant entry into the Austrian capital', time: '1938-03-14', order: 1 },
      { title: 'Annexation Declared', description: 'Austria is officially incorporated into the German Reich', time: '1938-03-15', order: 2 },
      { title: 'International Condemnation', description: 'World powers condemn the annexation but take no action', time: '1938-03-16', order: 3 },
    ]);

    const munichAgreement = await timelineService.createEvent({
      eraId: preWarEra.id,
      title: 'Munich Agreement',
      description: 'Germany, Italy, Great Britain, and France sign the Munich Agreement, ceding Sudetenland',
      time: '1938-09-30',
      order: 5,
    });
    await this.createScenesForEvent(munichAgreement.id, [
      { title: 'Conference Begins', description: 'Leaders meet in Munich to discuss the Sudetenland crisis', time: '1938-09-29', order: 0 },
      { title: 'Agreement Signed', description: 'The four powers sign the agreement without Czech representation', time: '1938-09-30', order: 1 },
      { title: 'Czechoslovakia Cedes Territory', description: 'Czechoslovakia is forced to give up the Sudetenland', time: '1938-10-01', order: 2 },
      { title: 'Chamberlain Returns', description: 'British Prime Minister returns claiming "peace for our time"', time: '1938-09-30', order: 3 },
    ]);

    const kristallnacht = await timelineService.createEvent({
      eraId: preWarEra.id,
      title: 'Kristallnacht',
      description: 'Nazi pogrom against Jews throughout Germany and Austria',
      time: '1938-11-09',
      order: 6,
    });
    await this.createScenesForEvent(kristallnacht.id, [
      { title: 'Synagogues Destroyed', description: 'Hundreds of synagogues are burned and destroyed across Germany', time: '1938-11-09', order: 0 },
      { title: 'Mass Arrests', description: 'Over 30,000 Jewish men are arrested and sent to concentration camps', time: '1938-11-10', order: 1 },
      { title: 'Businesses Looted', description: 'Jewish-owned businesses are vandalized and looted', time: '1938-11-09', order: 2 },
      { title: 'International Outrage', description: 'World leaders condemn the violence but take limited action', time: '1938-11-11', order: 3 },
    ]);

    // ========== EARLY WAR ERA EVENTS ==========
    const invasionPoland = await timelineService.createEvent({
      eraId: earlyWarEra.id,
      title: 'Invasion of Poland',
      description: 'Germany invades Poland, marking the start of World War II',
      time: '1939-09-01',
      order: 0,
    });
    await this.createScenesForEvent(invasionPoland.id, [
      { title: 'Blitzkrieg Begins', description: 'German forces launch rapid attack using combined arms', time: '1939-09-01', order: 0 },
      { title: 'Soviet Invasion', description: 'Soviet Union invades from the east per Molotov-Ribbentrop Pact', time: '1939-09-17', order: 1 },
      { title: 'Warsaw Falls', description: 'Polish capital surrenders after weeks of siege', time: '1939-09-28', order: 2 },
      { title: 'Poland Partitioned', description: 'Poland is divided between Germany and the Soviet Union', time: '1939-10-06', order: 3 },
    ]);

    const phonyWar = await timelineService.createEvent({
      eraId: earlyWarEra.id,
      title: 'Phony War',
      description: 'Period of limited military activity on the Western Front',
      time: '1939-10-01',
      order: 1,
    });
    await this.createScenesForEvent(phonyWar.id, [
      { title: 'Western Front Quiet', description: 'Little military action between Germany and Allies', time: '1939-10-01', order: 0 },
      { title: 'Naval Engagements', description: 'Allied and German navies engage in limited conflicts', time: '1939-10-15', order: 1 },
    ]);

    const invasionDenmarkNorway = await timelineService.createEvent({
      eraId: earlyWarEra.id,
      title: 'Invasion of Denmark and Norway',
      description: 'Germany launches Operation Weserübung to secure iron ore supplies',
      time: '1940-04-09',
      order: 2,
    });
    await this.createScenesForEvent(invasionDenmarkNorway.id, [
      { title: 'Denmark Surrenders', description: 'Denmark falls within hours of the invasion', time: '1940-04-09', order: 0 },
      { title: 'Norway Resists', description: 'Norwegian forces and Allies put up resistance', time: '1940-04-09', order: 1 },
      { title: 'Allied Landings', description: 'British and French forces land to support Norway', time: '1940-04-14', order: 2 },
      { title: 'Norway Falls', description: 'German forces complete the conquest of Norway', time: '1940-06-10', order: 3 },
    ]);

    const battleOfFrance = await timelineService.createEvent({
      eraId: earlyWarEra.id,
      title: 'Battle of France',
      description: 'Germany invades France and the Low Countries',
      time: '1940-05-10',
      order: 3,
    });
    await this.createScenesForEvent(battleOfFrance.id, [
      { title: 'Invasion Begins', description: 'German forces attack through the Ardennes', time: '1940-05-10', order: 0 },
      { title: 'Dunkirk Evacuation', description: 'Allied forces evacuate from Dunkirk beaches', time: '1940-05-26', order: 1 },
      { title: 'Paris Falls', description: 'German forces enter the French capital', time: '1940-06-14', order: 2 },
      { title: 'France Surrenders', description: 'France signs armistice with Germany', time: '1940-06-22', order: 3 },
      { title: 'Vichy France Established', description: 'Collaborationist government established in southern France', time: '1940-07-10', order: 4 },
    ]);

    const battleOfBritain = await timelineService.createEvent({
      eraId: earlyWarEra.id,
      title: 'Battle of Britain',
      description: 'German air campaign against the United Kingdom',
      time: '1940-07-10',
      order: 4,
    });
    await this.createScenesForEvent(battleOfBritain.id, [
      { title: 'Luftwaffe Attacks', description: 'German air force begins bombing British airfields', time: '1940-07-10', order: 0 },
      { title: 'The Blitz', description: 'Intensive bombing campaign against British cities', time: '1940-09-07', order: 1 },
      { title: 'RAF Victory', description: 'Royal Air Force successfully defends against Luftwaffe', time: '1940-10-15', order: 2 },
      { title: 'Operation Sea Lion Postponed', description: 'Hitler indefinitely postpones invasion of Britain', time: '1940-10-31', order: 3 },
    ]);

    const operationBarbarossa = await timelineService.createEvent({
      eraId: earlyWarEra.id,
      title: 'Operation Barbarossa',
      description: 'Germany invades the Soviet Union, the largest military operation in history',
      time: '1941-06-22',
      order: 5,
    });
    await this.createScenesForEvent(operationBarbarossa.id, [
      { title: 'Three-Pronged Attack', description: 'German forces advance on Leningrad, Moscow, and Kiev', time: '1941-06-22', order: 0 },
      { title: 'Rapid Advance', description: 'German forces make massive gains in the first weeks', time: '1941-07-01', order: 1 },
      { title: 'Siege of Leningrad Begins', description: 'German forces begin siege of Leningrad', time: '1941-09-08', order: 2 },
      { title: 'Battle for Moscow', description: 'German forces reach the outskirts of Moscow', time: '1941-10-02', order: 3 },
      { title: 'Soviet Counteroffensive', description: 'Red Army launches winter counterattack outside Moscow', time: '1941-12-05', order: 4 },
    ]);

    const pearlHarbor = await timelineService.createEvent({
      eraId: earlyWarEra.id,
      title: 'Attack on Pearl Harbor',
      description: 'Japan launches surprise attack on US naval base, bringing America into the war',
      time: '1941-12-07',
      order: 6,
    });
    await this.createScenesForEvent(pearlHarbor.id, [
      { title: 'First Wave Attack', description: 'Japanese aircraft strike Pearl Harbor at dawn', time: '1941-12-07', order: 0 },
      { title: 'Second Wave', description: 'Second wave of Japanese aircraft continues the attack', time: '1941-12-07', order: 1 },
      { title: 'US Declares War', description: 'United States declares war on Japan', time: '1941-12-08', order: 2 },
      { title: 'Germany Declares War on US', description: 'Hitler declares war on the United States', time: '1941-12-11', order: 3 },
    ]);

    // ========== GLOBAL WAR ERA EVENTS ==========
    const battleOfMidway = await timelineService.createEvent({
      eraId: globalWarEra.id,
      title: 'Battle of Midway',
      description: 'Decisive naval battle in the Pacific, turning point against Japan',
      time: '1942-06-04',
      order: 0,
    });
    await this.createScenesForEvent(battleOfMidway.id, [
      { title: 'Japanese Attack', description: 'Japanese forces launch attack on Midway Atoll', time: '1942-06-04', order: 0 },
      { title: 'US Counterattack', description: 'US carriers launch surprise attack on Japanese fleet', time: '1942-06-04', order: 1 },
      { title: 'Japanese Carriers Sunk', description: 'Four Japanese aircraft carriers are destroyed', time: '1942-06-04', order: 2 },
      { title: 'Strategic Victory', description: 'US gains strategic advantage in the Pacific', time: '1942-06-05', order: 3 },
    ]);

    const stalingrad = await timelineService.createEvent({
      eraId: globalWarEra.id,
      title: 'Battle of Stalingrad',
      description: 'Major turning point battle on the Eastern Front, largest battle in history',
      time: '1942-08-23',
      order: 1,
    });
    await this.createScenesForEvent(stalingrad.id, [
      { title: 'German Advance', description: 'German forces reach the Volga River and enter Stalingrad', time: '1942-08-23', order: 0 },
      { title: 'Street Fighting', description: 'Intense urban combat in the ruins of Stalingrad', time: '1942-09-13', order: 1 },
      { title: 'Soviet Encirclement', description: 'Red Army encircles German 6th Army', time: '1942-11-19', order: 2 },
      { title: 'German Surrender', description: 'Remaining German forces surrender, marking major defeat', time: '1943-02-02', order: 3 },
    ]);

    const elAlamein = await timelineService.createEvent({
      eraId: globalWarEra.id,
      title: 'Second Battle of El Alamein',
      description: 'Allied victory in North Africa, turning point in the desert war',
      time: '1942-10-23',
      order: 2,
    });
    await this.createScenesForEvent(elAlamein.id, [
      { title: 'Allied Offensive', description: 'British forces launch Operation Lightfoot', time: '1942-10-23', order: 0 },
      { title: 'Breakthrough', description: 'Allied forces break through German lines', time: '1942-11-02', order: 1 },
      { title: 'Rommel Retreats', description: 'German forces begin retreat across North Africa', time: '1942-11-04', order: 2 },
    ]);

    const kursk = await timelineService.createEvent({
      eraId: globalWarEra.id,
      title: 'Battle of Kursk',
      description: 'Largest tank battle in history, final German offensive on Eastern Front',
      time: '1943-07-05',
      order: 3,
    });
    await this.createScenesForEvent(kursk.id, [
      { title: 'German Offensive', description: 'Germany launches Operation Citadel against Kursk salient', time: '1943-07-05', order: 0 },
      { title: 'Tank Battle', description: 'Massive tank engagement at Prokhorovka', time: '1943-07-12', order: 1 },
      { title: 'Soviet Counterattack', description: 'Red Army launches massive counteroffensive', time: '1943-07-12', order: 2 },
      { title: 'German Defeat', description: 'German offensive fails, Soviets gain initiative', time: '1943-07-23', order: 3 },
    ]);

    const italyInvasion = await timelineService.createEvent({
      eraId: globalWarEra.id,
      title: 'Allied Invasion of Italy',
      description: 'Allies land in Italy, beginning the Italian Campaign',
      time: '1943-09-03',
      order: 4,
    });
    await this.createScenesForEvent(italyInvasion.id, [
      { title: 'Landings in Sicily', description: 'Allied forces land on Sicily', time: '1943-07-10', order: 0 },
      { title: 'Mainland Invasion', description: 'Allies cross into mainland Italy', time: '1943-09-03', order: 1 },
      { title: 'Italy Surrenders', description: 'Italy signs armistice with Allies', time: '1943-09-08', order: 2 },
      { title: 'German Resistance', description: 'German forces take control and continue fighting', time: '1943-09-09', order: 3 },
    ]);

    // ========== ALLIED ADVANCE ERA EVENTS ==========
    const dDay = await timelineService.createEvent({
      eraId: alliedAdvanceEra.id,
      title: 'D-Day Landings',
      description: 'Allied forces launch Operation Overlord, the largest seaborne invasion in history',
      time: '1944-06-06',
      order: 0,
    });
    await this.createScenesForEvent(dDay.id, [
      { title: 'Airborne Operations', description: 'Paratroopers drop behind enemy lines', time: '1944-06-06', order: 0 },
      { title: 'Beach Landings', description: 'Allied troops land on the beaches of Normandy', time: '1944-06-06', order: 1 },
      { title: 'Beachhead Secured', description: 'Allied forces establish foothold in Normandy', time: '1944-06-06', order: 2 },
      { title: 'Breakout from Normandy', description: 'Allies break out of the beachhead', time: '1944-07-25', order: 3 },
      { title: 'Liberation of Paris', description: 'Allied forces liberate the French capital', time: '1944-08-25', order: 4 },
    ]);

    const operationBagration = await timelineService.createEvent({
      eraId: alliedAdvanceEra.id,
      title: 'Operation Bagration',
      description: 'Massive Soviet offensive that destroys German Army Group Centre',
      time: '1944-06-22',
      order: 1,
    });
    await this.createScenesForEvent(operationBagration.id, [
      { title: 'Soviet Offensive Begins', description: 'Red Army launches massive attack', time: '1944-06-22', order: 0 },
      { title: 'Minsk Liberated', description: 'Soviet forces recapture Minsk', time: '1944-07-03', order: 1 },
      { title: 'German Collapse', description: 'German Army Group Centre is destroyed', time: '1944-07-15', order: 2 },
      { title: 'Soviets Reach Poland', description: 'Red Army reaches the Vistula River', time: '1944-07-28', order: 3 },
    ]);

    const battleOfTheBulge = await timelineService.createEvent({
      eraId: alliedAdvanceEra.id,
      title: 'Battle of the Bulge',
      description: 'Germany\'s last major offensive on the Western Front',
      time: '1944-12-16',
      order: 2,
    });
    await this.createScenesForEvent(battleOfTheBulge.id, [
      { title: 'Ardennes Offensive', description: 'German forces launch surprise attack through Ardennes forest', time: '1944-12-16', order: 0 },
      { title: 'Bastogne Siege', description: 'US 101st Airborne holds out against German siege', time: '1944-12-20', order: 1 },
      { title: 'Allied Counterattack', description: 'Allied forces counterattack and push Germans back', time: '1945-01-03', order: 2 },
      { title: 'German Defeat', description: 'German offensive fails, last reserves exhausted', time: '1945-01-25', order: 3 },
    ]);

    // ========== END OF WAR ERA EVENTS ==========
    const yaltaConference = await timelineService.createEvent({
      eraId: endWarEra.id,
      title: 'Yalta Conference',
      description: 'Big Three meet to plan post-war world',
      time: '1945-02-04',
      order: 0,
    });
    await this.createScenesForEvent(yaltaConference.id, [
      { title: 'Big Three Meet', description: 'Roosevelt, Churchill, and Stalin meet in Crimea', time: '1945-02-04', order: 0 },
      { title: 'Post-War Plans', description: 'Leaders discuss division of Germany and Europe', time: '1945-02-05', order: 1 },
      { title: 'United Nations', description: 'Agreement to establish United Nations', time: '1945-02-11', order: 2 },
    ]);

    const veDay = await timelineService.createEvent({
      eraId: endWarEra.id,
      title: 'Victory in Europe Day',
      description: 'Nazi Germany surrenders, ending the war in Europe',
      time: '1945-05-08',
      order: 1,
    });
    await this.createScenesForEvent(veDay.id, [
      { title: 'Unconditional Surrender', description: 'Germany signs unconditional surrender', time: '1945-05-07', order: 0 },
      { title: 'Celebrations Begin', description: 'Allied nations celebrate victory in Europe', time: '1945-05-08', order: 1 },
      { title: 'War Ends in Europe', description: 'Hostilities officially end at midnight', time: '1945-05-09', order: 2 },
    ]);

    const potsdamConference = await timelineService.createEvent({
      eraId: endWarEra.id,
      title: 'Potsdam Conference',
      description: 'Allied leaders meet to plan post-war Europe',
      time: '1945-07-17',
      order: 2,
    });
    await this.createScenesForEvent(potsdamConference.id, [
      { title: 'Big Three Meet', description: 'Stalin, Truman, and Churchill discuss post-war arrangements', time: '1945-07-17', order: 0 },
      { title: 'Germany Divided', description: 'Agreement to divide Germany into occupation zones', time: '1945-08-01', order: 1 },
      { title: 'Potsdam Declaration', description: 'Ultimatum issued to Japan to surrender', time: '1945-07-26', order: 2 },
    ]);

    const hiroshima = await timelineService.createEvent({
      eraId: endWarEra.id,
      title: 'Atomic Bomb on Hiroshima',
      description: 'First atomic weapon used in warfare',
      time: '1945-08-06',
      order: 3,
    });
    await this.createScenesForEvent(hiroshima.id, [
      { title: 'Bomb Dropped', description: 'Enola Gay drops atomic bomb on Hiroshima', time: '1945-08-06', order: 0 },
      { title: 'Massive Destruction', description: 'City is devastated by the atomic blast', time: '1945-08-06', order: 1 },
      { title: 'International Reaction', description: 'World reacts to the use of atomic weapons', time: '1945-08-07', order: 2 },
    ]);

    const nagasaki = await timelineService.createEvent({
      eraId: endWarEra.id,
      title: 'Atomic Bomb on Nagasaki',
      description: 'Second atomic bomb dropped on Japan',
      time: '1945-08-09',
      order: 4,
    });
    await this.createScenesForEvent(nagasaki.id, [
      { title: 'Second Bomb', description: 'Bockscar drops atomic bomb on Nagasaki', time: '1945-08-09', order: 0 },
      { title: 'Japan Considers Surrender', description: 'Japanese leadership debates surrender', time: '1945-08-10', order: 1 },
    ]);

    const vjDay = await timelineService.createEvent({
      eraId: endWarEra.id,
      title: 'Victory over Japan Day',
      description: 'Japan surrenders, ending World War II',
      time: '1945-09-02',
      order: 5,
    });
    await this.createScenesForEvent(vjDay.id, [
      { title: 'Surrender Signed', description: 'Japan signs surrender aboard USS Missouri', time: '1945-09-02', order: 0 },
      { title: 'War Ends', description: 'World War II officially ends', time: '1945-09-02', order: 1 },
      { title: 'Global Celebrations', description: 'Allied nations celebrate final victory', time: '1945-09-02', order: 2 },
    ]);

    // ========== POST-WAR ERA EVENTS ==========
    const nurembergTrials = await timelineService.createEvent({
      eraId: postWarEra.id,
      title: 'Nuremberg Trials',
      description: 'War crimes trials of Nazi leaders',
      time: '1945-11-20',
      order: 0,
    });
    await this.createScenesForEvent(nurembergTrials.id, [
      { title: 'Trial Begins', description: 'Opening statements in the first major war crimes trial', time: '1945-11-20', order: 0 },
      { title: 'Evidence Presented', description: 'Prosecution presents evidence of Nazi crimes', time: '1946-01-01', order: 1 },
      { title: 'Defense Arguments', description: 'Defendants present their cases', time: '1946-07-01', order: 2 },
      { title: 'Verdicts Delivered', description: 'Sentences handed down to Nazi leaders', time: '1946-10-01', order: 3 },
    ]);

    const trumanDoctrine = await timelineService.createEvent({
      eraId: postWarEra.id,
      title: 'Truman Doctrine',
      description: 'US policy to contain Soviet expansion, beginning of Cold War',
      time: '1947-03-12',
      order: 1,
    });
    await this.createScenesForEvent(trumanDoctrine.id, [
      { title: 'Doctrine Announced', description: 'President Truman announces policy of containment', time: '1947-03-12', order: 0 },
      { title: 'Aid to Greece and Turkey', description: 'US provides military and economic aid', time: '1947-03-15', order: 1 },
    ]);

    const marshallPlan = await timelineService.createEvent({
      eraId: postWarEra.id,
      title: 'Marshall Plan',
      description: 'American aid program to rebuild Western Europe',
      time: '1948-04-03',
      order: 2,
    });
    await this.createScenesForEvent(marshallPlan.id, [
      { title: 'Plan Announced', description: 'Secretary of State Marshall announces European Recovery Program', time: '1948-04-03', order: 0 },
      { title: 'Aid Distribution', description: 'Billions in aid distributed to Western European nations', time: '1948-07-01', order: 1 },
      { title: 'Economic Recovery', description: 'European economies begin to recover', time: '1949-01-01', order: 2 },
    ]);

    const berlinBlockade = await timelineService.createEvent({
      eraId: postWarEra.id,
      title: 'Berlin Blockade',
      description: 'Soviet Union blocks access to West Berlin',
      time: '1948-06-24',
      order: 3,
    });
    await this.createScenesForEvent(berlinBlockade.id, [
      { title: 'Blockade Begins', description: 'Soviets cut off all land routes to West Berlin', time: '1948-06-24', order: 0 },
      { title: 'Berlin Airlift', description: 'Allies supply West Berlin by air for nearly a year', time: '1948-06-26', order: 1 },
      { title: 'Blockade Lifted', description: 'Soviets end the blockade', time: '1949-05-12', order: 2 },
    ]);

    const natoFormed = await timelineService.createEvent({
      eraId: postWarEra.id,
      title: 'NATO Formed',
      description: 'North Atlantic Treaty Organization established',
      time: '1949-04-04',
      order: 4,
    });
    await this.createScenesForEvent(natoFormed.id, [
      { title: 'Treaty Signed', description: 'NATO founding treaty signed in Washington', time: '1949-04-04', order: 0 },
      { title: 'Alliance Established', description: 'Military alliance between North American and European nations', time: '1949-08-24', order: 1 },
    ]);

    const koreanWar = await timelineService.createEvent({
      eraId: postWarEra.id,
      title: 'Korean War Begins',
      description: 'North Korea invades South Korea, first major conflict of Cold War',
      time: '1950-06-25',
      order: 5,
    });
    await this.createScenesForEvent(koreanWar.id, [
      { title: 'Invasion Begins', description: 'North Korean forces cross the 38th parallel', time: '1950-06-25', order: 0 },
      { title: 'UN Intervention', description: 'United Nations authorizes military intervention', time: '1950-06-27', order: 1 },
      { title: 'US Forces Deploy', description: 'American forces arrive to support South Korea', time: '1950-07-01', order: 2 },
    ]);

    return timeline;
  }

  /**
   * Create an example fictional timeline with 5+ eras
   */
  async createExampleFictionalTimeline() {
    // Create timeline
    const timeline = await timelineService.createTimeline({
      title: 'The Chronicles of Eldoria',
      description: 'An epic fantasy timeline following the rise and fall of kingdoms across ages',
      isFictional: true,
    });

    // Era 1: The Age of Legends
    const ancientEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'The Age of Legends',
      description: 'A time when gods walked among mortals and magic flowed freely',
      startTime: null,
      endTime: null,
      order: 0,
      positionRelativeTo: null,
      positionType: null,
    });

    // Era 2: The First Kingdoms
    const firstKingdomsEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'The First Kingdoms',
      description: 'The first mortal kingdoms are established across Eldoria',
      startTime: null,
      endTime: null,
      order: 1,
      positionRelativeTo: ancientEra.id,
      positionType: 'after',
    });

    // Era 3: The Great War
    const greatWarEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'The Great War',
      description: 'The kingdoms of Eldoria clash in a devastating conflict that reshapes the world',
      startTime: null,
      endTime: null,
      order: 2,
      positionRelativeTo: firstKingdomsEra.id,
      positionType: 'after',
    });

    // Era 4: The Age of Rebuilding
    const rebuildingEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'The Age of Rebuilding',
      description: 'The kingdoms rebuild and forge new alliances in the aftermath of war',
      startTime: null,
      endTime: null,
      order: 3,
      positionRelativeTo: greatWarEra.id,
      positionType: 'after',
    });

    // Era 5: The Golden Age
    const goldenAgeEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'The Golden Age',
      description: 'A period of unprecedented prosperity and cultural achievement',
      startTime: null,
      endTime: null,
      order: 4,
      positionRelativeTo: rebuildingEra.id,
      positionType: 'after',
    });

    // Era 6: The Dark Times
    const darkTimesEra = await timelineService.createEra({
      timelineId: timeline.id,
      title: 'The Dark Times',
      description: 'A shadow falls over Eldoria as dark forces rise to power',
      startTime: null,
      endTime: null,
      order: 5,
      positionRelativeTo: goldenAgeEra.id,
      positionType: 'after',
    });

    // ========== ANCIENT ERA EVENTS ==========
    const creationEvent = await timelineService.createEvent({
      eraId: ancientEra.id,
      title: 'The Creation of the World',
      description: 'The gods shape the realm of Eldoria from chaos',
      time: null,
      order: 0,
      positionRelativeTo: null,
      positionType: null,
    });
    await this.createScenesForEvent(creationEvent.id, [
      { title: 'The Forging', description: 'The gods forge the mountains and valleys', time: null, order: 0 },
      { title: 'The Awakening', description: 'The first mortals awaken in the new world', time: null, order: 1 },
      { title: 'The First Magic', description: 'Magic flows into the world for the first time', time: null, order: 2 },
    ]);

    const firstKingEvent = await timelineService.createEvent({
      eraId: ancientEra.id,
      title: 'The First King',
      description: 'The first mortal king is crowned by the gods themselves',
      time: null,
      order: 1,
      positionRelativeTo: creationEvent.id,
      positionType: 'after',
    });
    await this.createScenesForEvent(firstKingEvent.id, [
      { title: 'The Choosing', description: 'The gods choose the first mortal ruler', time: null, order: 0 },
      { title: 'The Coronation', description: 'The first king is crowned in a grand ceremony', time: null, order: 1 },
      { title: 'The First Laws', description: 'The first laws of the realm are established', time: null, order: 2 },
    ]);

    // ========== FIRST KINGDOMS ERA EVENTS ==========
    const kingdomFormation = await timelineService.createEvent({
      eraId: firstKingdomsEra.id,
      title: 'The Five Kingdoms',
      description: 'The five great kingdoms of Eldoria are established',
      time: null,
      order: 0,
      positionRelativeTo: null,
      positionType: null,
    });
    await this.createScenesForEvent(kingdomFormation.id, [
      { title: 'Kingdom of Aetheria', description: 'The northern kingdom of magic is founded', time: null, order: 0 },
      { title: 'Kingdom of Terrania', description: 'The southern kingdom of strength is established', time: null, order: 1 },
      { title: 'Kingdom of Aquaria', description: 'The eastern kingdom of the seas is formed', time: null, order: 2 },
      { title: 'Kingdom of Ignisia', description: 'The western kingdom of fire is created', time: null, order: 3 },
      { title: 'Kingdom of Venturia', description: 'The central kingdom of winds is founded', time: null, order: 4 },
    ]);

    const firstAlliance = await timelineService.createEvent({
      eraId: firstKingdomsEra.id,
      title: 'The First Alliance',
      description: 'The five kingdoms form their first alliance',
      time: null,
      order: 1,
      positionRelativeTo: kingdomFormation.id,
      positionType: 'after',
    });
    await this.createScenesForEvent(firstAlliance.id, [
      { title: 'The Council', description: 'Leaders of all five kingdoms meet', time: null, order: 0 },
      { title: 'The Pact', description: 'The kingdoms sign the Pact of Unity', time: null, order: 1 },
    ]);

    // ========== GREAT WAR ERA EVENTS ==========
    const warBegins = await timelineService.createEvent({
      eraId: greatWarEra.id,
      title: 'War Breaks Out',
      description: 'Tensions escalate and the Great War begins',
      time: null,
      order: 0,
      positionRelativeTo: null,
      positionType: null,
    });
    await this.createScenesForEvent(warBegins.id, [
      { title: 'The Betrayal', description: 'One kingdom betrays the alliance', time: null, order: 0 },
      { title: 'First Battle', description: 'The first major battle of the war', time: null, order: 1 },
      { title: 'Alliances Shift', description: 'Kingdoms form new alliances', time: null, order: 2 },
    ]);

    const battleOfKings = await timelineService.createEvent({
      eraId: greatWarEra.id,
      title: 'Battle of the Five Kings',
      description: 'The five kingdoms clash in the greatest battle ever seen',
      time: null,
      order: 1,
      positionRelativeTo: warBegins.id,
      positionType: 'after',
    });
    await this.createScenesForEvent(battleOfKings.id, [
      { title: 'The Charge', description: 'The armies charge across the plains', time: null, order: 0 },
      { title: 'Magic Unleashed', description: 'Powerful magic is unleashed on the battlefield', time: null, order: 1 },
      { title: 'The Fall', description: 'The last king falls, ending the war', time: null, order: 2 },
      { title: 'The Aftermath', description: 'The battlefield is left in ruins', time: null, order: 3 },
    ]);

    const peaceTreaty = await timelineService.createEvent({
      eraId: greatWarEra.id,
      title: 'The Treaty of Unity',
      description: 'The kingdoms sign a peace treaty, ending the Great War',
      time: null,
      order: 2,
      positionRelativeTo: battleOfKings.id,
      positionType: 'after',
    });
    await this.createScenesForEvent(peaceTreaty.id, [
      { title: 'Negotiations', description: 'Leaders meet to negotiate peace', time: null, order: 0 },
      { title: 'Treaty Signed', description: 'The Treaty of Unity is signed', time: null, order: 1 },
    ]);

    // ========== REBUILDING ERA EVENTS ==========
    const greatCouncil = await timelineService.createEvent({
      eraId: rebuildingEra.id,
      title: 'The Great Council',
      description: 'Leaders from all kingdoms meet to establish new laws',
      time: null,
      order: 0,
      positionRelativeTo: null,
      positionType: null,
    });
    await this.createScenesForEvent(greatCouncil.id, [
      { title: 'Council Convenes', description: 'Representatives gather from all kingdoms', time: null, order: 0 },
      { title: 'New Laws', description: 'New laws are established for the realm', time: null, order: 1 },
      { title: 'Trade Agreements', description: 'Trade routes are reopened between kingdoms', time: null, order: 2 },
    ]);

    const reconstruction = await timelineService.createEvent({
      eraId: rebuildingEra.id,
      title: 'The Great Reconstruction',
      description: 'The kingdoms begin rebuilding their cities and lands',
      time: null,
      order: 1,
      positionRelativeTo: greatCouncil.id,
      positionType: 'after',
    });
    await this.createScenesForEvent(reconstruction.id, [
      { title: 'Rebuilding Cities', description: 'Destroyed cities are rebuilt', time: null, order: 0 },
      { title: 'Restoring Magic', description: 'Magical sites are restored', time: null, order: 1 },
      { title: 'New Alliances', description: 'New alliances are forged', time: null, order: 2 },
    ]);

    // ========== GOLDEN AGE ERA EVENTS ==========
    const goldenAgeBegins = await timelineService.createEvent({
      eraId: goldenAgeEra.id,
      title: 'The Golden Age Begins',
      description: 'Prosperity returns to Eldoria',
      time: null,
      order: 0,
      positionRelativeTo: null,
      positionType: null,
    });
    await this.createScenesForEvent(goldenAgeBegins.id, [
      { title: 'Economic Boom', description: 'Trade flourishes across the realm', time: null, order: 0 },
      { title: 'Cultural Renaissance', description: 'Arts and culture flourish', time: null, order: 1 },
      { title: 'Magical Advancement', description: 'New magical discoveries are made', time: null, order: 2 },
      { title: 'Peace and Prosperity', description: 'The realm enjoys unprecedented peace', time: null, order: 3 },
    ]);

    const greatLibrary = await timelineService.createEvent({
      eraId: goldenAgeEra.id,
      title: 'The Great Library',
      description: 'The greatest library in history is built',
      time: null,
      order: 1,
      positionRelativeTo: goldenAgeBegins.id,
      positionType: 'after',
    });
    await this.createScenesForEvent(greatLibrary.id, [
      { title: 'Construction Begins', description: 'Work begins on the Great Library', time: null, order: 0 },
      { title: 'Knowledge Gathered', description: 'Books and scrolls from all kingdoms are collected', time: null, order: 1 },
      { title: 'Library Opens', description: 'The Great Library opens to scholars', time: null, order: 2 },
    ]);

    // ========== DARK TIMES ERA EVENTS ==========
    const shadowRises = await timelineService.createEvent({
      eraId: darkTimesEra.id,
      title: 'The Shadow Rises',
      description: 'Dark forces begin to gather in the shadows',
      time: null,
      order: 0,
      positionRelativeTo: null,
      positionType: null,
    });
    await this.createScenesForEvent(shadowRises.id, [
      { title: 'First Signs', description: 'Strange occurrences are reported', time: null, order: 0 },
      { title: 'Dark Magic', description: 'Dark magic begins to spread', time: null, order: 1 },
      { title: 'The Awakening', description: 'An ancient evil awakens', time: null, order: 2 },
    ]);

    const lastStand = await timelineService.createEvent({
      eraId: darkTimesEra.id,
      title: 'The Last Stand',
      description: 'The kingdoms unite for one final battle against darkness',
      time: null,
      order: 1,
      positionRelativeTo: shadowRises.id,
      positionType: 'after',
    });
    await this.createScenesForEvent(lastStand.id, [
      { title: 'The Gathering', description: 'Forces from all kingdoms gather', time: null, order: 0 },
      { title: 'The Battle', description: 'The final battle begins', time: null, order: 1 },
      { title: 'Victory', description: 'Light triumphs over darkness', time: null, order: 2 },
      { title: 'New Hope', description: 'A new era of hope begins', time: null, order: 3 },
    ]);

    return timeline;
  }

  /**
   * Populate all example timelines
   */
  async populateAllExamples() {
    const timelines = [];
    timelines.push(await this.createExampleHistoricalTimeline());
    timelines.push(await this.createExampleFictionalTimeline());
    return timelines;
  }
}

export default new SeedDataService();
