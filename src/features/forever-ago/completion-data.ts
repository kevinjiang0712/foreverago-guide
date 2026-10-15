export const completionChapters = [
  {id:'opening',label:'Opening & Woolson Falls'},
  {id:'gas-station',label:"Karl's Pump 'n' Mart"},
  {id:'diner',label:'Highway Star Diner'},
  {id:'sam',label:"Sam's detour"},
  {id:'camp',label:'Road camp'},
  {id:'resort',label:"Buccaneers' Retreat"},
  {id:'lighthouse',label:'Winslow Lighthouse'},
  {id:'peak',label:'Williamina Peak'},
  {id:'epilogue',label:'Home epilogue'},
  {id:'journey',label:'Across the journey'},
] as const;

export type CompletionChapter = typeof completionChapters[number]['id'];
export type CompletionType = 'achievement'|'memory'|'rest'|'photo';
export type CompletionEntry = {
  id:string; type:CompletionType; chapter:CompletionChapter; name:string;
  location:string; action:string; condition:string;
  guideId:string; guideHeading:string; epicXP?:number;
};
export type LinkedCompletionEntry = CompletionEntry & {href:string};

const achievementsGuide = 'forever-ago-achievements';
const achievementHeadings = {
  story:'Separate story milestones from extra actions', bedroom:'Begin with the bedroom photography task',
  gas:"Make Karl's Pump 'n' Mart a full exploration stop", diner:'Treat the diner as more than a meal stop',
  sam:'Finish the smaller challenges around Sam', resort:'Give the resort a separate completion pass',
  late:'Complete the late-game interaction conditions', camera:'Check the remaining photography goals after the story',
};

function achievement(id:string,name:string,chapter:CompletionChapter,location:string,action:string,condition:string,epicXP:number,guideHeading:string,guideId=achievementsGuide):CompletionEntry {
  return {id:`achievement-${id}`,type:'achievement',name,chapter,location,action,condition,epicXP,guideId,guideHeading};
}

export const achievementEntries:CompletionEntry[] = [
  achievement('first-coffee','Alright, First Coffee','lighthouse','Winslow Lighthouse day trip','Finish the lighthouse day-trip sequence.','Finish your day trip to the lighthouse.',30,achievementHeadings.story),
  achievement('back-on-road','Back On The Road','journey',"Alfred's story route",'Continue the story when Alfred finds a reason to carry on.','Find a reason to keep going.',30,achievementHeadings.story),
  achievement('before-forget','Before I Forget Myself','gas-station',"Karl's Pump 'n' Mart",'Buy the road-trip supplies and finish the gas-station story sequence.','Stop by the local gas station and stock up for the road trip.',30,achievementHeadings.gas),
  achievement('bowside','Bowside 360','resort','Resort boat','Complete a full 360-degree spin with the boat.','Do a 360 spin with a boat.',105,achievementHeadings.resort),
  achievement('chrono-selfie','Chrono Selfie','gas-station',"Milton at Karl's Pump 'n' Mart",'Use selfie mode and include Alfred and Milton in the same shot.','Take a selfie with Milton.',80,'Frame Alfred and Milton together','forever-ago-selfie-achievement'),
  achievement('focus-finder','Focus Finder','journey','Camera during the journey','Take photographs while exploring; journal selections are a separate count.','Take 25 photos.',25,'Build the photo milestones during normal exploration','forever-ago-camera-achievements'),
  achievement('glimpse','Glimpse Into The Past','journey','Any named petal vignette','Collect the local petals, find their gathering point and reveal the memory with the camera.','Find a vignette.',15,'Verify the memory before leaving its landmark','forever-ago-memory-locations'),
  achievement('green-thumb','Green Thumb','sam',"Sam's plants",'Water your side of the garden efficiently and refill at the faucet when needed.','Beat Sam in watering her plants.',30,achievementHeadings.sam),
  achievement('guardian-lord','Guardian Lord','resort','Resort arcade','Keep playing Guardian Lord until you beat the record; participation alone does not meet the requirement.','Beat the Arcade\'s high score.',30,'Reach the Guardian Lord cabinet','forever-ago-guardian-lord'),
  achievement('hatless','Hatless','diner','Motel pool lounge chairs, then the diner backyard','Take the optional nap, follow Maddy\'s later backyard investigation and recover the cap; check the platform unlock.','Lose Alfred\'s hat while taking a nap.',15,achievementHeadings.diner),
  achievement('swantastic','Have a Swantastic Day','journey','Memorable tree on the story route','Follow the tree-carving interaction when the story presents it.','Carve your initials into a memorable tree.',30,achievementHeadings.story),
  achievement('doggo-photo',"It's A Bird, It's A Plane, It's Doggo",'lighthouse','Bird-nest photography sequence','Lower the camera toward Doggo instead of framing the nest.','Take a photo of Doggo instead of the bird\'s nest.',15,'Lower the framing from the nest to the dog','forever-ago-dog-photo'),
  achievement('wish','Make A Wish','camp','Shooting-star scene at the road camp','Choose an option promptly when the shooting-star choice appears.','Be quick when spotting a shooting star.',15,achievementHeadings.sam),
  achievement('old-bones','Old Bones','journey','Two gas-station rests, three diner rests and one resort rest','Use each of the six separate rest interactions during a continuous journey.','Take every opportunity to rest for a moment.',105,'Keep the six checks separate','forever-ago-old-bones-achievement'),
  achievement('fetch','Olympic-Level Stick Thrower','resort','Doggo at the resort','Start three separate rounds of fetch.','Start three rounds of fetch with Doggo.',25,achievementHeadings.resort),
  achievement('patience','Patience Of A Saint','gas-station','Road atlas and windshield wipers in the store','Let Milton finish both sales pitches before taking the items.','One does not simply interrupt Milton.',25,achievementHeadings.gas),
  achievement('petal-collector','Petal Collector','journey','Seven named vignettes across the gas station, diner and resort','Finish each petal cluster and its gathering-point camera interaction.','Find all vignettes.',80,'Use memory names to find the missing part of the set','forever-ago-petal-collector-achievement'),
  achievement('picture-perfect','Picture Perfect','journey','Camera during the journey','Continue taking normal photographs until the larger milestone unlocks.','Take 50 photos.',30,'Build the photo milestones during normal exploration','forever-ago-camera-achievements'),
  achievement('scallyrat','Scallyrat Roberts','resort','Resort notes and newspaper clippings','Read the eight pieces of written material on the completion route before the boat departure.','Learn what led to the resort\'s collapse.',30,'Identify the eight written clues','forever-ago-scallyrat-roberts'),
  achievement('self-portrait','Self-Portrait Photography','journey','Camera in selfie mode','Take ten selfies; normal forward-facing photographs are different.','Take 10 selfies.',15,'Take ten actual selfies for Self-Portrait Photography','forever-ago-selfie-achievement'),
  achievement('shaun-jason','Shaun and Jason','peak','Climb toward Williamina Peak','Call for Doggo at least 30 times while the search interaction is available.','During the climb, call out for Doggo at least 30 times.',15,achievementHeadings.late),
  achievement('shopaholic','Shopaholic','gas-station','Store shelves before paying Milton','Collect the required supplies and all optional products, including chips, canned goods, air freshener, shirt and sticker.','Buy all the things at Karl\'s Pump \'n\' Mart.',25,'Buy all eight listed products','forever-ago-shopaholic'),
  achievement('snooping','Snooping Shutterbug','opening',"Alfred's bedroom",'Photograph the room\'s distinct curious objects; leave the calendar and Alfred\'s window portrait until the room sweep is complete. Use the candidate checklist and check your platform unlock.','Take a photo of every curious object in Alfred\'s room.',15,'Bedroom sweep before the calendar','forever-ago-snooping-shutterbug'),
  achievement('drawer','Stupid Thing!','sam',"Broken kitchen drawer in Sam's house",'Close the drawer, leave the kitchen so it reopens, and repeat for five closures.','"Fix" the broken kitchen drawer.',15,achievementHeadings.sam),
  achievement('plumage','The Plundered Plumage','resort','Accessible locked resort space near the entrance','After obtaining the bolt cutter, revisit the entrance area and find Marley\'s bobblehead before boarding the boat.','Find Marley\'s bobblehead.',15,'Return to the resort entrance with the bolt cutter','forever-ago-marleys-bobblehead'),
  achievement('cancelled',"Trip's Cancelled",'journey',"Alfred's story route",'Follow the story through the moment described by the achievement.','You just want to go home.',30,achievementHeadings.story),
  achievement('name',"What's In A Name",'journey','Doggo naming interaction','Choose a name for the dog when the story offers the interaction.','Give Doggo a name.',15,achievementHeadings.story),
  achievement('pumpkins',"World's Largest Mosaic Pumpkin Collection",'epilogue',"Audrey's mosaic pumpkins at home",'Inspect the seven pumpkins across the office, hallway, bathroom, stairwell, living and dining areas before finishing.','Find all of Audrey\'s mosaic pumpkins at home.',30,'Seven pumpkin locations in the epilogue','forever-ago-mosaic-pumpkins'),
  achievement('destination',"You Can't Plan Life",'peak',"Alfred's destination",'Continue the final story route to Alfred\'s destination.','Reach Alfred\'s destination.',80,achievementHeadings.story),
];

function rest(id:string,name:string,chapter:CompletionChapter,location:string,action:string,guideHeading:string):CompletionEntry {
  return {id:`rest-${id}`,type:'rest',name,chapter,location,action,condition:'Activate the rest prompt and allow the interaction to play out.',guideId:'forever-ago-old-bones-achievement',guideHeading};
}
export const restEntries:CompletionEntry[] = [
  rest('forecourt','Forecourt wooden bench','gas-station','Trees and rocks beside the gas-station forecourt','Sit on the wooden bench.','First stop: check the gas-station exterior'),
  rest('sofa','Store yellow sofa','gas-station','Seating corner beside the coffee station and arcade cabinet','Use Sit Down on the sofa.','Second gas-station check: use the indoor seating'),
  rest('nap','Motel pool nap','diner','Striped lounge chairs beneath the orange parasols','Lie down for the nap.','Diner section: expect three more opportunities'),
  rest('tree-bench','Diner tree bench','diner','Red bench beneath a tree, below the raised restaurant terrace','Sit on this red bench.','Diner section: expect three more opportunities'),
  rest('overlook-bench','Diner overlook bench','diner','Second red bench near the lily flowers, telescope and sea-facing railing','Sit on the separate overlook bench.','Diner section: expect three more opportunities'),
  rest('lake','Resort lake overlook','resort','Wooden overlook beyond the resort map board','Use Take In View at the lake-facing railing.','Resort section: find the final rest before leaving'),
];

function memory(id:string,name:string,chapter:CompletionChapter,location:string,action:string,guideHeading:string):CompletionEntry {
  return {id:`memory-${id}`,type:'memory',name,chapter,location,action,condition:'After the vignette unlocks, find the gathered petals and photograph the memory.',guideId:'forever-ago-memory-locations',guideHeading};
}
export const memoryEntries:CompletionEntry[] = [
  memory('fun-colors','Fun & Colors','gas-station','Playground swings, picnic table, blue slide and sandpit','Collect the three local petals around the playground.','Fun & Colors at the gas-station playground'),
  memory('pumpkin',"The World's Largest Mosaic Pumpkin",'gas-station','Giant mosaic pumpkin and its information board','Search the ground around the display; follow the live counter rather than an assumed petal total.',"The World's Largest Mosaic Pumpkin beside the display"),
  memory('morning','The Morning After','diner','Motel pool steps and umbrella; slide, green fence and pool rules board','Inspect both petals in the pool area.','The Morning After at the motel swimming pool'),
  memory('shelter','Seeking Shelter','diner','Diner terrace stairs and glass-door threshold','Inspect the two petals around the terrace and entrance.','Seeking Shelter at the diner approach'),
  memory('marley','Farewell Forever, Marley','resort','Graffiti-marked wall and large pirate statue base','Inspect the two petals near the wall and statue.','Farewell Forever, Marley around the resort statue'),
  memory('tradition',"It's Tradition",'resort','Pirate face cutout, nearby low wall and bench','Inspect the three petals around the cutout and its adjacent furniture.',"It's Tradition near the pirate photo cutout"),
  memory('adults','Responsible Adults','resort','Harbor building, wooden platforms and short stairs by the life rings','Inspect the three harbor petals before the story boat departure.','Responsible Adults around the harbor platforms'),
];

function photo(id:string,name:string,chapter:CompletionChapter,location:string,action:string,condition:string,guideHeading:string,guideId='forever-ago-photo-locations'):CompletionEntry {
  return {id:`photo-${id}`,type:'photo',name,chapter,location,action,condition,guideId,guideHeading};
}
export const photoEntries:CompletionEntry[] = [
  photo('bedroom','Bedroom objects','opening','Bed, desk, study wall and the area above the door','Sweep the room\'s distinct curious objects before the calendar prompt and Alfred\'s window portrait; use the candidate list.','Finish your room sweep and check Snooping Shutterbug in your platform list.','Bedroom sweep before the calendar','forever-ago-snooping-shutterbug'),
  photo('window','Alfred at the bedroom window','opening','Window facing the parked car','Aim at Alfred posing outside the window.','The introduction advances to the car ride.','Bedroom subjects before the window shot'),
  photo('road-sign','Roadside Woolson Falls sign','opening','Drive toward Woolson Falls','Photograph the roadside sign when Alfred points it out.','Take the photograph of the prompted sign.','Drive and trail photographs at Woolson Falls'),
  photo('trail','Woolson Falls trail sequence','opening','Low flowers, trail sign and Alfred\'s poses','Crouch for the low flowers, photograph the sign and respond to each prompted pose.','Complete the current sequence; an earlier pose does not replace a later prompt.','Drive and trail photographs at Woolson Falls'),
  photo('couple','Couple photograph and journal','opening','Waterfall hike endpoint','Photograph Alfred and Audrey together, shake the instant picture and place it in the journal.','The picture is developed and placed in the journal.','Drive and trail photographs at Woolson Falls'),
  photo('diner-dog',"Maddy's dog request",'diner','Bins and rubbish area behind the diner, through the right-side fence','Speak to Maddy, photograph the dog beside the bins and report back.','Maddy grants booth access after the request is completed.','Frame the animal beside the bins','forever-ago-dog-photo'),
  photo('booth','Diner booth window','diner','Reserved booth inside the diner','Complete the active diner tasks, sit in the permitted booth and photograph the exterior view.','The story transitions into the memory with Audrey.','Window photograph from the diner booth'),
  photo('sam','Selfie with Sam','sam','Seated endpoint of the field walk','Finish the repair and field-walk sequence, then take the seated selfie with Sam.','Add this selfie to the journal.','Selfie at the end of Sam\'s walk'),
  photo('boat','Boat-ride photograph','resort','Boat trip toward the island','Complete the resort access tasks, board the boat and take the prompted photograph during the ride.','The memory with Audrey begins; rowing is the next separate task.','Boat photograph at Buccaneers\' Retreat'),
  photo('charles','Charles photography sequence','lighthouse','Charles\' seated stops during the walk','Follow Charles and respond to the prompted camera views when he sits.','Complete the prompted shots before continuing along the trail.','Charles and the lighthouse photograph'),
  photo('lighthouse','Top of Winslow Lighthouse','lighthouse','Lighthouse entrance after reading the sign','Aim at the top of the lighthouse and take the photograph.','The photograph begins the lighthouse memory.','Charles and the lighthouse photograph'),
];

export const completionEntries = [...achievementEntries,...memoryEntries,...restEntries,...photoEntries];
export const completionTypeLabels:Record<CompletionType,string> = {achievement:'Achievement',memory:'Vignette',rest:'Rest stop',photo:'Photo task'};

export type CompletionToolMode = 'all'|'achievements'|'collectibles'|'memories'|'rests'|'photos';
export function completionToolForPage(pageId:string):CompletionToolMode|null {
  if(pageId==='forever-ago-completion-tracker')return 'all';
  if(pageId==='forever-ago-achievements')return 'achievements';
  if(pageId==='forever-ago-collectibles')return 'collectibles';
  if(['forever-ago-memory-locations','forever-ago-petal-locations','forever-ago-petal-collector-achievement'].includes(pageId))return 'memories';
  if(pageId==='forever-ago-old-bones-achievement')return 'rests';
  if(pageId==='forever-ago-photo-locations')return 'photos';
  return null;
}
export function entriesForCompletionMode(mode:CompletionToolMode):CompletionEntry[] {
  if(mode==='all')return completionEntries;
  if(mode==='collectibles')return completionEntries.filter(entry=>entry.type!=='achievement');
  const type:CompletionType = mode==='achievements'?'achievement':mode==='memories'?'memory':mode==='rests'?'rest':'photo';
  return completionEntries.filter(entry=>entry.type===type);
}
