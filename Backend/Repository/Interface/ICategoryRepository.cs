namespace KovilpattiSnacks.Repository.Interface;

public interface ICategoryRepository
{
    Task<bool> ExistsAsync(int id, CancellationToken ct = default);
}
