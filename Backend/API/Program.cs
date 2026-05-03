using KovilpattiSnacks.API.HealthChecks;
using KovilpattiSnacks.API.Middleware;
using KovilpattiSnacks.Business;
using KovilpattiSnacks.Business.Implementation;
using KovilpattiSnacks.Business.Interface;
using KovilpattiSnacks.Repository.Interface;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Register Business → Repository (chained inside AddBusiness)
builder.Services.AddBusiness(builder.Configuration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Kovilpatti Snacks API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the JWT (Swagger will add the 'Bearer ' prefix)."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS — origins come from Cors:AllowedOrigins per environment.
// Empty list = all cross-origin requests rejected (fail-secure).
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p => p
        .WithOrigins(allowedOrigins)
        .AllowAnyMethod()
        .AllowAnyHeader()));

// Health checks — "api" is a trivial liveness check; "database" pings Postgres.
builder.Services.AddHealthChecks()
    .AddCheck("api", () => HealthCheckResult.Healthy("API process is up."))
    .AddCheck<DbHealthCheck>("database");

var app = builder.Build();

// Swagger — always on in Development; controlled by Swagger:Enabled in other envs.
var enableSwagger = app.Environment.IsDevelopment()
    || builder.Configuration.GetValue<bool>("Swagger:Enabled");

if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Auto-seed admin if no admin row exists. Idempotent (AnyAdminAsync guard).
// Skipped silently when Seed:AdminPassword is not configured — required only on first deploy.
{
    var seedPassword = builder.Configuration["Seed:AdminPassword"];
    if (!string.IsNullOrWhiteSpace(seedPassword))
    {
        using var scope = app.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        await AdminSeeder.SeedAsync(
            users,
            hasher,
            username: builder.Configuration["Seed:AdminUsername"] ?? "admin",
            password: seedPassword,
            fullName: builder.Configuration["Seed:AdminFullName"] ?? "Admin");
    }
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Health endpoint — anonymous. Pings DB; returns 503 if any check fails.
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (ctx, report) =>
    {
        ctx.Response.ContentType = "application/json";
        var payload = new
        {
            status = report.Status.ToString(),
            env = app.Environment.EnvironmentName,
            totalDurationMs = report.TotalDuration.TotalMilliseconds,
            time = DateTimeOffset.UtcNow,
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                durationMs = e.Value.Duration.TotalMilliseconds,
                description = e.Value.Description,
                error = e.Value.Exception?.Message
            })
        };
        await ctx.Response.WriteAsJsonAsync(payload);
    }
});

app.MapControllers();

app.Run();
