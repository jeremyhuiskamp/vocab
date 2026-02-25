# known issues to work on

- language setting is too granular
    - don't want to mix two languages in one unit
    - it's possible to prompt for a german word in french, and it seems to translate

- there doesn't seem to be any reason to only allow particular languages
  - in fact, is there any reason gemini can't guess from input?

- evaluated words (correct, incorrect) inexplicably have a top margin that offsets them from the sentence

- questions can be ambiguous in the face of eg präteritum vs perfekt
  - Der Junge [ist → ging] direkt auf seine Mutter [zugegangen → zu].
  - ideas:
    - standardize on only perfekt
    - allow either
    - give a hint about what is expected in that sentence

- the sentence ranker gets stuck on the same 5 questions after not long