# features to work on

- authentication for the admin

- more wysiwyg editor
  - separate entries for each section of the sentence is too tedious
  - ideally just a text box with the ability to underline

- stats while practising
  - total number of sentences in unit
  - sentences answered at least once
  - number of sentences with poor score (< 75% ?)
  - for each sentence, maybe the score?

- write an overall spec and turn it into a test suite

- dedupe some of the css

- rename a unit

- view an entire unit in a compact form
  - it's just two sentences
  - maybe in learner mode?
    - along with stats

- some sort of feature to help with verbs that have multiple meanings
  - eg zugehen
  - need to keep generating more until I have coverage of several different meanings
  - hard to keep track of what's there in the current editor
  - being able to re-order would help
  - or categorizing the entries, though that's fuzzier
  - would be helpful to be able to prompt for a specific sense

- handle a quota rejection from gemini and display the delay until I can try again
  - though the numbers it quotes don't seem accurate?

- don't have a submit button while practising
  - just hitting return in a text box is fine
  - but block it if there are any empty text boxes

- save a prompt with a unit
  - eg "root gehen, with various prefixes"
  - makes it easier to extend a unit on a theme