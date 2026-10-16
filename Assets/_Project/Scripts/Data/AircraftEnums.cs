namespace FireWing.Data
{
    /// <summary>Progression branch for an aircraft.</summary>
    public enum AircraftBranch { Light, Scooper, Heavy, Helicopter }

    /// <summary>Primary engine category used by the flight profile.</summary>
    public enum AircraftEngineType { Piston, Turboprop, Jet, Turbine }

    /// <summary>How an aircraft releases its firefighting payload.</summary>
    public enum DropReleaseMode { Salvo, Line, Gated, Bucket }

    /// <summary>Material types supported by a drop pattern.</summary>
    public enum DropPayloadType { Water, Retardant, Foam }
}