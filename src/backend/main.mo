import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";

actor {
  include MixinStorage();

  // Types
  type Session = {
    id : Text;
    eventName : Text;
    date : Time.Time;
    layoutType : Text;
    photoCount : Nat;
    createdAt : Time.Time;
  };

  module Session {
    public func compare(session1 : Session, session2 : Session) : Order.Order {
      Text.compare(session1.id, session2.id);
    };
  };

  type FilterPreset = {
    id : Text;
    name : Text;
    exposure : Float;
    contrast : Float;
    highlights : Float;
    shadows : Float;
    temperature : Float;
    tint : Float;
    grain : Float;
    fade : Float;
    sharpness : Float;
    vignette : Float;
    createdAt : Time.Time;
  };

  module FilterPreset {
    public func compare(preset1 : FilterPreset, preset2 : FilterPreset) : Order.Order {
      Text.compare(preset1.id, preset2.id);
    };
  };

  type Template = {
    id : Text;
    name : Text;
    layoutType : Text;
    schemaJson : Text;
    createdAt : Time.Time;
  };

  module Template {
    public func compare(template1 : Template, template2 : Template) : Order.Order {
      Text.compare(template1.id, template2.id);
    };
  };

  type BrandingConfig = {
    photographerName : Text;
    logoUrl : Text;
    fontFamily : Text;
    fontSize : Nat;
    color : Text;
    opacity : Float;
    positionX : Float;
    positionY : Float;
    enabled : Bool;
  };

  type EventMode = {
    isLocked : Bool;
    activeTemplateId : ?Text;
    activeFilterPresetId : ?Text;
  };

  // Storage
  let sessions = Map.empty<Text, Session>();
  let filterPresets = Map.empty<Text, FilterPreset>();
  let templates = Map.empty<Text, Template>();

  var brandingConfig : ?BrandingConfig = null;
  var eventMode : EventMode = {
    isLocked = false;
    activeTemplateId = null;
    activeFilterPresetId = null;
  };

  // Sessions
  public shared ({ caller }) func createSession(id : Text, eventName : Text, date : Time.Time, layoutType : Text, photoCount : Nat) : async () {
    if (sessions.containsKey(id)) { Runtime.trap("Session already exists") };
    let session : Session = {
      id;
      eventName;
      date;
      layoutType;
      photoCount;
      createdAt = Time.now();
    };
    sessions.add(id, session);
  };

  public query ({ caller }) func getSession(id : Text) : async Session {
    switch (sessions.get(id)) {
      case (?session) { session };
      case (null) { Runtime.trap("Session does not exist") };
    };
  };

  public query ({ caller }) func getAllSessions() : async [Session] {
    sessions.values().toArray().sort();
  };

  // Filter Presets
  public shared ({ caller }) func createFilterPreset(id : Text, name : Text, exposure : Float, contrast : Float, highlights : Float, shadows : Float, temperature : Float, tint : Float, grain : Float, fade : Float, sharpness : Float, vignette : Float) : async () {
    if (filterPresets.containsKey(id)) { Runtime.trap("Filter preset already exists") };
    let preset : FilterPreset = {
      id;
      name;
      exposure;
      contrast;
      highlights;
      shadows;
      temperature;
      tint;
      grain;
      fade;
      sharpness;
      vignette;
      createdAt = Time.now();
    };
    filterPresets.add(id, preset);
  };

  public query ({ caller }) func getFilterPreset(id : Text) : async FilterPreset {
    switch (filterPresets.get(id)) {
      case (?preset) { preset };
      case (null) { Runtime.trap("Filter preset does not exist") };
    };
  };

  public query ({ caller }) func getAllFilterPresets() : async [FilterPreset] {
    filterPresets.values().toArray().sort();
  };

  // Templates
  public shared ({ caller }) func createTemplate(id : Text, name : Text, layoutType : Text, schemaJson : Text) : async () {
    if (templates.containsKey(id)) { Runtime.trap("Template already exists") };
    let template : Template = {
      id;
      name;
      layoutType;
      schemaJson;
      createdAt = Time.now();
    };
    templates.add(id, template);
  };

  public query ({ caller }) func getTemplate(id : Text) : async Template {
    switch (templates.get(id)) {
      case (?template) { template };
      case (null) { Runtime.trap("Template does not exist") };
    };
  };

  public query ({ caller }) func getAllTemplates() : async [Template] {
    templates.values().toArray().sort();
  };

  // Branding Config
  public shared ({ caller }) func setBrandingConfig(config : BrandingConfig) : async () {
    brandingConfig := ?config;
  };

  public query ({ caller }) func getBrandingConfig() : async ?BrandingConfig {
    brandingConfig;
  };

  // Event Mode
  public shared ({ caller }) func setEventMode(isLocked : Bool, activeTemplateId : ?Text, activeFilterPresetId : ?Text) : async () {
    eventMode := {
      isLocked;
      activeTemplateId;
      activeFilterPresetId;
    };
  };

  public query ({ caller }) func getEventMode() : async EventMode {
    eventMode;
  };
};
