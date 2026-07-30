// Daily rotation order. Add new packs here — order defines the schedule.
import bos2013 from "./bos2013.js";
import bos2007 from "./bos2007.js";
import okc2021 from "./okc2021.js";
import mia2010 from "./mia2010.js";
import cle2003 from "./cle2003.js";
import cle2014 from "./cle2014.js";
import gsw2014 from "./gsw2014.js";
import det2002 from "./det2002.js";
import lal2019 from "./lal2019.js";
import lal2004 from "./lal2004.js";
import phi2016 from "./phi2016.js";
import dal2007 from "./dal2007.js";
import tor2018 from "./tor2018.js";
import mil2017 from "./mil2017.js";
import sas2011 from "./sas2011.js";

// Order mixes eras and difficulty so consecutive days feel different.
const PACKS = [
  bos2013, cle2014, det2002, gsw2014, lal2004, tor2018, okc2021,
  mia2010, dal2007, sas2011, phi2016, cle2003, lal2019, mil2017, bos2007
];
export default PACKS;
